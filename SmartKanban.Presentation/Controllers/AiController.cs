using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartKanban.Application.Services;
using SmartKanban.Domain.Entities;
using SmartKanban.Domain.Interfaces;
using System.Text.Json;
using System.Text;

namespace SmartKanban.Presentation.Controllers
{
    [Route("api/v1/ai")]
    [ApiController]
    [Authorize]
    public class AiController : ControllerBase
    {
        private readonly AiService _aiService;
        private readonly ICardRepository _cardRepository;
        // 💡 Lôi thêm Cột và Bảng vào để lấy Full Trạng Thái
        private readonly IColumnRepository _columnRepository;
        private readonly IBoardRepository _boardRepository;

        // API Key của sếp
        private readonly string _geminiApiKey;
        private static readonly HttpClient _httpClient = new HttpClient();

        // 💡 Nhớ chích (Inject) thêm 2 thằng Repository này vào Constructor nhé sếp
        public AiController(AiService aiService, ICardRepository cardRepository, IColumnRepository columnRepository, IBoardRepository boardRepository, IConfiguration configuration)
        {
            var rawKey = configuration["Gemini:ApiKey"] ?? string.Empty;
            _geminiApiKey = rawKey.Replace("\"", "").Trim();
            _aiService = aiService;
            _cardRepository = cardRepository;
            _columnRepository = columnRepository;
            _boardRepository = boardRepository;
        }

        public class AiBreakdownRequest
        {
            public string CardId { get; set; } = string.Empty;
        }

        [HttpPost("generate-checklist")]
        public async Task<IActionResult> GenerateChecklist([FromBody] AiBreakdownRequest request)
        {
            var card = await _cardRepository.GetByIdAsync(request.CardId);
            if (card == null) return NotFound(new { message = "Thẻ không tồn tại." });

            if (string.IsNullOrWhiteSpace(card.Title))
                return BadRequest(new { message = "Thẻ cần có tiêu đề để AI phân tích." });

            try
            {
                var jsonResponse = await _aiService.GenerateChecklistAsync(card.Title, card.Description);
                var aiChecklists = JsonSerializer.Deserialize<List<ChecklistItem>>(jsonResponse, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (aiChecklists != null && aiChecklists.Any())
                {
                    card.Checklists.AddRange(aiChecklists);
                    await _cardRepository.UpdateAsync(card.Id, card);
                    return StatusCode(201, card.Checklists);
                }
                return BadRequest(new { message = "AI không thể sinh ra danh sách hợp lệ." });
            }
            catch (Exception ex)
            {
                return StatusCode(503, new { message = "Hệ thống AI đang bận, vui lòng thử lại sau.", error = ex.Message });
            }
        }

        public class ChatRequest
        {
            public string Prompt { get; set; } = string.Empty;
        }

        [HttpPost("chat")]
        public async Task<IActionResult> ChatWithGemini([FromBody] ChatRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Prompt))
                return BadRequest(new { message = "Bạn chưa nhập câu hỏi!" });

            try
            {
                var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_geminiApiKey}";

                // =====================================================================
                // 🧠 HỐT SẠCH MỌI NGÓC NGÁCH CỦA DATABASE CHO AI (RAG MAX LEVEL)
                // =====================================================================
                string dbContext = "DỮ LIỆU TOÀN BỘ HỆ THỐNG SMART KANBAN HIỆN TẠI:\n\n";

                try
                {
                    var allCards = await _cardRepository.GetAllAsync() ?? new List<Card>();
                    var allColumns = await _columnRepository.GetAllAsync() ?? new List<Column>();
                    var allBoards = await _boardRepository.GetAllAsync() ?? new List<Board>();

                    if (allCards.Any())
                    {
                        foreach (var card in allCards)
                        {
                            // Tìm xem thẻ này đang ở Cột nào (Để lấy Trạng thái Hoàn thành/Đang làm)
                            var col = allColumns.FirstOrDefault(c => c.Id == card.ColumnId);
                            string status = col != null ? col.Title : "Chưa phân loại";

                            // Tìm xem thẻ này thuộc Dự án (Bảng) nào
                            string boardName = "Dự án ẩn";
                            if (col != null)
                            {
                                var board = allBoards.FirstOrDefault(b => b.Id == col.BoardId);
                                boardName = board != null ? board.Title : "Dự án ẩn";
                            }

                            // Đếm số Checklist đã hoàn thành
                            int totalChecklist = card.Checklists?.Count ?? 0;
                            int doneChecklist = card.Checklists?.Count(c => c.IsCompleted) ?? 0;

                            // Bơm toàn bộ thông tin này vào 1 dòng
                            dbContext += $"- Dự án: [{boardName}] | Thẻ: [{card.Title}] | Trạng thái: [{status}] | Checklist: {doneChecklist}/{totalChecklist} mục đã xong | Mô tả: '{card.Description}'\n";
                        }
                    }
                    else
                    {
                        dbContext += "(Hệ thống hiện tại đang trống, chưa có công việc nào được tạo)\n";
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Lỗi gom Database: " + ex.Message);
                    dbContext += "(Không thể truy xuất Database lúc này)\n";
                }

                // =====================================================================
                // 🧠 RA LỆNH CHO AI CHỈ ĐỌC DATA TRONG NÀY
                // =====================================================================
                string heThongCuaSep = $@"
Bạn là Smart AI Assistant - Trợ lý ảo xuất sắc của hệ thống Smart Kanban.
Sếp của bạn đang hỏi về tiến độ công việc. Dưới đây là BẢN BÁO CÁO TOÀN BỘ DATABASE theo thời gian thực:

{dbContext}

Quy tắc bắt buộc:
1. LUÔN LUÔN DỰA VÀO DỮ LIỆU TRÊN để trả lời. Nếu thẻ nằm ở cột 'Done' hoặc 'Hoàn thành', hãy báo là đã xong.
2. Xưng 'em', gọi người dùng là 'sếp'. Trả lời thân thiện, pha chút hài hước.

Câu hỏi của sếp: ";

                var payload = new
                {
                    contents = new[] { new { parts = new[] { new { text = heThongCuaSep + req.Prompt } } } }
                };

                var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(url, content);
                var jsonString = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    return Ok(new { reply = "😅 Lỗi từ Google API rồi sếp ơi. Sếp đợi 1 phút nữa nhắn lại em nhé!" });
                }

                using var doc = JsonDocument.Parse(jsonString);
                var reply = doc.RootElement.GetProperty("candidates")[0]
                                           .GetProperty("content")
                                           .GetProperty("parts")[0]
                                           .GetProperty("text").GetString();

                return Ok(new { reply = reply });
            }
            catch (Exception ex)
            {
                return Ok(new { reply = "❌ Lỗi hệ thống C#: " + ex.Message });
            }
        }
    }
}
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using SmartKanban.Domain.Entities;
using SmartKanban.Domain.Interfaces;
using SmartKanban.Presentation.Hubs;
using System.Security.Claims;

namespace SmartKanban.Presentation.Controllers
{
    [Route("api/v1/columns")]
    [ApiController]
    [Authorize]
    public class ColumnController : ControllerBase
    {
        private readonly IColumnRepository _columnRepository;
        private readonly IHubContext<KanbanHub> _hubContext;
        private readonly IBoardRepository _boardRepository;

        public ColumnController(IColumnRepository columnRepository, IHubContext<KanbanHub> hubContext, IBoardRepository boardRepository)
        {
            _columnRepository = columnRepository;
            _hubContext = hubContext;
            _boardRepository = boardRepository;
        }

        public class CreateColumnDto
        {
            public string BoardId { get; set; } = string.Empty;
            public string Title { get; set; } = string.Empty;
        }

        [HttpPost]
        public async Task<IActionResult> CreateColumn([FromBody] CreateColumnDto payload)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var board = await _boardRepository.GetByIdAsync(payload.BoardId);
            if (board?.ViewerIds != null && board.ViewerIds.Contains(currentUserId))
                return StatusCode(403, "Khách không có quyền thêm cột!");

            if (string.IsNullOrWhiteSpace(payload.Title))
                return BadRequest(new { message = "Tên cột không được để trống." });
            var existingCols = await _columnRepository.GetColumnsByBoardIdAsync(payload.BoardId);
            if (existingCols.Any(c => c.Title.Equals(payload.Title, StringComparison.OrdinalIgnoreCase)))
            {
                return BadRequest(new { message = "⚠️ Tên cột này đã tồn tại trong dự án! Vui lòng chọn tên khác." });
            }
            var newColumn = new Column
            {
                BoardId = payload.BoardId,
                Title = payload.Title,
                CreatedAt = DateTime.UtcNow,
                CardOrderIds = new List<string>()
            };

            await _columnRepository.CreateAsync(newColumn);

            // =======================================================
            // 💡 CHÈN CỘT MỚI VÀO KẾ CUỐI ĐỂ KHÔNG CƯỚP VỊ TRÍ CỘT DONE
            // =======================================================
            if (board.ColumnOrderIds == null) board.ColumnOrderIds = new List<string>();

            if (board.ColumnOrderIds.Count > 0)
            {
                // Chèn vào vị trí áp chót
                int insertIndex = board.ColumnOrderIds.Count - 1;
                board.ColumnOrderIds.Insert(insertIndex, newColumn.Id);
            }
            else
            {
                board.ColumnOrderIds.Add(newColumn.Id);
            }
            await _boardRepository.UpdateAsync(board.Id, board);

            await _hubContext.Clients.All.SendAsync("ReceiveBoardUpdate", payload.BoardId);

            return Ok(newColumn);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteColumn(string id)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId)) return Unauthorized("Không nhận diện được người dùng.");

            var column = await _columnRepository.GetByIdAsync(id);
            if (column == null) return NotFound("Không tìm thấy cột này.");

            var board = await _boardRepository.GetByIdAsync(column.BoardId);
            if (board == null) return NotFound("Không tìm thấy bảng chứa cột này.");

            var role = User.Claims.FirstOrDefault(c => c.Type.ToLower().Contains("role"))?.Value?.ToLower();
            bool isAdmin = role == "admin";
            bool isOwner = board.OwnerId == currentUserId;
            bool isMember = board.MemberIds != null && board.MemberIds.Contains(currentUserId);

            if (!isAdmin && !isOwner && !isMember)
            {
                return StatusCode(403, new { message = "Lỗi bảo mật: Bạn chưa được mời vào bảng này nên không có quyền xóa cột!" });
            }

            // 💡 Lấy trực tiếp column.Title truyền vào câu báo lỗi
            string lastColumnId = board.ColumnOrderIds?.LastOrDefault();
            if (id == lastColumnId && !isAdmin && !isOwner)
            {
                return StatusCode(403, new { message = $"🔒 Cột '{column.Title}' là chốt chặn cuối cùng. Chỉ Chủ bảng mới có quyền Xóa cột này!" });
            }

            await _columnRepository.DeleteAsync(id);

            if (board.ColumnOrderIds != null)
            {
                board.ColumnOrderIds.Remove(id);
                await _boardRepository.UpdateAsync(board.Id, board);
            }

            await _hubContext.Clients.All.SendAsync("ReceiveBoardUpdate", column.BoardId);
            return Ok(new { message = "Đã xóa cột thành công." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateColumn(string id, [FromBody] UpdateColumnDto payload)
        {
            var column = await _columnRepository.GetByIdAsync(id);
            if (column == null) return NotFound(new { message = "Không tìm thấy cột!" });

            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var board = await _boardRepository.GetByIdAsync(column.BoardId);
            var userRole = User.Claims.FirstOrDefault(c => c.Type.Contains("role"))?.Value?.ToLower();

            if (board?.ViewerIds != null && board.ViewerIds.Contains(currentUserId))
                return StatusCode(403, "Khách không có quyền sửa cột!");

            bool isAdminOrOwner = userRole == "admin" || board.OwnerId == currentUserId;

            // 💡 Lấy trực tiếp column.Title
            string lastColumnId = board.ColumnOrderIds?.LastOrDefault();
            if (id == lastColumnId && !isAdminOrOwner)
            {
                return StatusCode(403, new { message = $"🔒 Cột '{column.Title}' là chốt chặn cuối cùng. Chỉ Chủ bảng mới có quyền Đổi tên cột này!" });
            }

            if (string.IsNullOrWhiteSpace(payload.Title)) return BadRequest(new { message = "Tên cột không hợp lệ!" });
            var existingCols = await _columnRepository.GetColumnsByBoardIdAsync(column.BoardId);
            if (existingCols.Any(c => c.Id != id && c.Title.Equals(payload.Title, StringComparison.OrdinalIgnoreCase)))
            {
                return BadRequest(new { message = "⚠️ Tên cột này đã bị trùng với một cột khác trong dự án!" });
            }
            column.Title = payload.Title;
            await _columnRepository.UpdateAsync(id, column);
            await _hubContext.Clients.All.SendAsync("ReceiveBoardUpdate", column.BoardId);

            return Ok(new { message = "Cập nhật thành công!", column });
        }

        public class UpdateColumnDto
        {
            public string Title { get; set; } = string.Empty;
        }

       
        [HttpPut("{id}/workflow")]
        public async Task<IActionResult> UpdateColumnWorkflow(string id, [FromBody] List<string> allowedNextColumnIds)
        {
            var column = await _columnRepository.GetByIdAsync(id);
            if (column == null) return NotFound("Không tìm thấy cột.");

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var board = await _boardRepository.GetByIdAsync(column.BoardId);
            var userRole = User.Claims.FirstOrDefault(c => c.Type.Contains("role"))?.Value?.ToLower();

            if (board.OwnerId != currentUserId && userRole != "admin")
            {
                return StatusCode(403, new { message = "Chỉ Quản trị viên dự án mới có quyền cấu hình luồng làm việc!" });
            }

            column.AllowedNextColumnIds = allowedNextColumnIds ?? new List<string>();
            await _columnRepository.UpdateAsync(id, column);

            return Ok(new { message = "✅ Đã lưu cấu hình luồng làm việc thành công!", column });
        }
    }
}
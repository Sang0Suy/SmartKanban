using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using SmartKanban.Domain.Entities;
using SmartKanban.Infrastructure.Data;
using System.Security.Claims;

namespace SmartKanban.Presentation.Controllers
{
    [Route("api/v1/feedbacks")]
    [ApiController]
    [Authorize]
    public class FeedbackController : ControllerBase
    {
        private readonly IMongoCollection<Feedback> _feedbackCollection;

        public FeedbackController(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _feedbackCollection = database.GetCollection<Feedback>("Feedbacks");
        }

        public class CreateFeedbackDto
        {
            public int Rating { get; set; }
            public string Comment { get; set; } = string.Empty;
            public string UserName { get; set; } = string.Empty; // 💡 Hứng tên từ Frontend
        }

        [HttpPost]
        public async Task<IActionResult> SubmitFeedback([FromBody] CreateFeedbackDto payload)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (payload.Rating < 1 || payload.Rating > 5)
                return BadRequest(new { message = "Số sao đánh giá không hợp lệ!" });

            var feedback = new Feedback
            {
                UserId = currentUserId ?? "Anonymous",
                UserName = string.IsNullOrWhiteSpace(payload.UserName) ? "Khách" : payload.UserName,
                Rating = payload.Rating,
                Comment = payload.Comment,
                CreatedAt = DateTime.UtcNow
            };

            await _feedbackCollection.InsertOneAsync(feedback);
            return Ok(new { message = "Gửi đánh giá thành công!" });
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAllFeedbacks()
        {
            var data = await _feedbackCollection.Find(_ => true)
                                                .SortByDescending(f => f.CreatedAt)
                                                .Limit(20)
                                                .ToListAsync();
            return Ok(data);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFeedback(string id)
        {
            var result = await _feedbackCollection.DeleteOneAsync(f => f.Id == id);
            if (result.DeletedCount == 0) return NotFound(new { message = "Không tìm thấy!" });
            return Ok(new { message = "Đã xóa đánh giá thành công!" });
        }

        // ==========================================================
        // 💡 API MỚI: LƯU PHẢN HỒI CỦA SẾP
        // ==========================================================
        public class ReplyDto { public string Reply { get; set; } = string.Empty; }

        [HttpPost("{id}/reply")]
        public async Task<IActionResult> ReplyFeedback(string id, [FromBody] ReplyDto dto)
        {
            var feedback = await _feedbackCollection.Find(f => f.Id == id).FirstOrDefaultAsync();
            if (feedback == null) return NotFound(new { message = "Không tìm thấy đánh giá!" });

            feedback.AdminReply = dto.Reply;
            feedback.RepliedAt = DateTime.UtcNow;

            await _feedbackCollection.ReplaceOneAsync(f => f.Id == id, feedback);
            return Ok(feedback);
        }
    }
}
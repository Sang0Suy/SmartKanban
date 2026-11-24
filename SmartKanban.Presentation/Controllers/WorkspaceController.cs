using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using SmartKanban.Domain.Entities;
using SmartKanban.Infrastructure.Data;
using System.Security.Claims;

namespace SmartKanban.Presentation.Controllers
{
    [Route("api/v1/workspaces")]
    [ApiController]
    [Authorize]
    public class WorkspaceController : ControllerBase
    {
        private readonly IMongoCollection<Workspace> _workspaceCollection;

        // 💡 Tuyệt chiêu: Dùng thẳng MongoClient ở đây để sếp không cần setup Repository rườm rà
        public WorkspaceController(IOptions<MongoDbSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _workspaceCollection = database.GetCollection<Workspace>("Workspaces");
        }

        [HttpGet]
        public async Task<IActionResult> GetMyWorkspaces()
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(currentUserId)) return Unauthorized();

            // Tìm các Workspace mà mình là Sếp (Owner) HOẶC là Nhân viên (Member)
            var filter = Builders<Workspace>.Filter.Or(
                Builders<Workspace>.Filter.Eq(w => w.OwnerId, currentUserId),
                Builders<Workspace>.Filter.AnyEq(w => w.MemberIds, currentUserId)
            );

            var workspaces = await _workspaceCollection.Find(filter).ToListAsync();

            // 💡 AUTO-CREATE: Nếu User chưa có Workspace nào, tự động tạo 1 cái mặc định cho họ
            if (workspaces.Count == 0)
            {
                var defaultWs = new Workspace
                {
                    Name = "Không gian cá nhân",
                    Description = "Workspace mặc định của bạn",
                    OwnerId = currentUserId,
                    MemberIds = new List<string> { currentUserId },
                    CreatedAt = DateTime.UtcNow
                };
                await _workspaceCollection.InsertOneAsync(defaultWs);
                workspaces.Add(defaultWs);
            }

            return Ok(workspaces);
        }

        public class CreateWorkspaceDto
        {
            public string Name { get; set; } = string.Empty;
        }

        [HttpPost]
        public async Task<IActionResult> CreateWorkspace([FromBody] CreateWorkspaceDto payload)
        {
            var currentUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(payload.Name))
                return BadRequest(new { message = "⚠️ Tên Không gian làm việc không được để trống!" });

            var newWs = new Workspace
            {
                Name = payload.Name.Trim(),
                OwnerId = currentUserId,
                MemberIds = new List<string> { currentUserId },
                CreatedAt = DateTime.UtcNow
            };

            await _workspaceCollection.InsertOneAsync(newWs);
            return Ok(newWs);
        }
    }
}
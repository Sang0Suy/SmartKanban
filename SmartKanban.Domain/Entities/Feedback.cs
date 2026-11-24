using System;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace SmartKanban.Domain.Entities
{
    [BsonIgnoreExtraElements]
    public class Feedback
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        [BsonElement("userId")]
        public string UserId { get; set; } = string.Empty;

        [BsonElement("rating")]
        public int Rating { get; set; } // Số sao (1 - 5)

        [BsonElement("comment")]
        public string Comment { get; set; } = string.Empty;

        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        [BsonElement("userName")]
        public string UserName { get; set; } = "Người dùng ẩn danh";
        [BsonElement("adminReply")]
        public string AdminReply { get; set; } = string.Empty;
        [BsonElement("repliedAt")]
        public DateTime? RepliedAt { get; set; }
    }
}
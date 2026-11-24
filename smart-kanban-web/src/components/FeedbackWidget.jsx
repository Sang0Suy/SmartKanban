import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import { toast } from 'react-toastify';

const FeedbackWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('write'); // 'write' hoặc 'history'
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [myFeedbacks, setMyFeedbacks] = useState([]);

    // Lấy thông tin user hiện tại
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const currentUserId = currentUser ? (currentUser.id || currentUser.Id) : null;

    // Tự động tải lịch sử khi mở tab "Lịch sử của tôi"
    useEffect(() => {
        if (isOpen && activeTab === 'history') {
            fetchMyFeedbacks();
        }
    }, [isOpen, activeTab]);

    const fetchMyFeedbacks = async () => {
        try {
            const res = await axios.get('/api/v1/feedbacks');
            // Chỉ lọc lấy những đánh giá do chính mình viết
            const mine = res.data.filter(fb => (fb.userId || fb.UserId) === currentUserId);
            setMyFeedbacks(mine);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.warning("⚠️ Vui lòng chọn số sao đánh giá!");
            return;
        }
        setIsSubmitting(true);
        try {
            const uName = currentUser ? (currentUser.fullName || currentUser.name) : "Người dùng";
            await axios.post('/api/v1/feedbacks', {
                rating: rating,
                comment: comment,
                userName: uName
            });
            toast.success("💖 Cảm ơn bạn đã đánh giá hệ thống!");
            setRating(0);
            setComment('');
            setActiveTab('history'); // 💡 Gửi xong tự động chuyển sang xem Lịch sử
        } catch (error) {
            console.error("Chi tiết lỗi:", error);
            toast.error("❌ Lỗi khi gửi đánh giá. Vui lòng thử lại!");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999 }}>
            {isOpen && (
                <div style={{
                    position: 'absolute', bottom: '60px', right: '0', width: '340px',
                    background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)', overflow: 'hidden',
                    animation: 'slideUp 0.3s ease-out', display: 'flex', flexDirection: 'column'
                }}>
                    {/* 💡 MENU CHUYỂN TAB */}
                    <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <button
                            onClick={() => setActiveTab('write')}
                            style={{ flex: 1, padding: '12px', background: activeTab === 'write' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: activeTab === 'write' ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            ✍️ Viết Đánh giá
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            style={{ flex: 1, padding: '12px', background: activeTab === 'history' ? 'rgba(255,255,255,0.05)' : 'transparent', border: 'none', color: activeTab === 'history' ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: 'bold', cursor: 'pointer' }}
                        >
                            🕒 Lịch sử của tôi
                        </button>
                        <button onClick={() => setIsOpen(false)} style={{ padding: '0 16px', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>✖</button>
                    </div>

                    {/* 💡 NỘI DUNG TỪNG TAB */}
                    <div style={{ padding: '20px', maxHeight: '400px', overflowY: 'auto' }}>
                        {activeTab === 'write' ? (
                            <>
                                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: '0 0 16px 0', textAlign: 'center' }}>Trải nghiệm của bạn với Smart Kanban thế nào?</p>
                                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', justifyContent: 'center' }}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                            key={star} onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)}
                                            style={{ fontSize: '32px', cursor: 'pointer', transition: 'all 0.2s', color: star <= (hoverRating || rating) ? '#ffbd2e' : 'rgba(255,255,255,0.1)', transform: star <= hoverRating ? 'scale(1.2)' : 'scale(1)' }}
                                        >★</span>
                                    ))}
                                </div>
                                <textarea
                                    value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Chia sẻ thêm cảm nhận của bạn (Tùy chọn)..."
                                    style={{ width: '100%', height: '80px', padding: '12px', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '13px', outline: 'none', resize: 'none', marginBottom: '16px' }}
                                />
                                <button
                                    onClick={handleSubmit} disabled={isSubmitting}
                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #0c66e4, #4A9FFF)', color: '#fff', fontWeight: 'bold', cursor: 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
                                >
                                    {isSubmitting ? 'Đang gửi...' : 'Gửi Đánh Giá'}
                                </button>
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {!currentUserId ? (
                                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px', padding: '20px 0' }}>Vui lòng đăng nhập để xem lịch sử.</div>
                                ) : myFeedbacks.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '13px', padding: '20px 0' }}>Bạn chưa gửi đánh giá nào.</div>
                                ) : (
                                    myFeedbacks.map(fb => (
                                        <div key={fb.id || fb.Id} style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <div style={{ color: '#ffbd2e', fontSize: '12px' }}>{"★".repeat(fb.rating || fb.Rating)}</div>
                                                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>{new Date(fb.createdAt || fb.CreatedAt).toLocaleDateString('vi-VN')}</div>
                                            </div>
                                            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontStyle: 'italic', marginBottom: (fb.adminReply || fb.AdminReply) ? '12px' : '0' }}>"{fb.comment || fb.Comment || 'Không có bình luận'}"</div>

                                            {/* 💡 ĐÂY LÀ CHỖ HIỂN THỊ CÂU TRẢ LỜI CỦA ADMIN */}
                                            {(fb.adminReply || fb.AdminReply) && (
                                                <div style={{ background: 'rgba(12, 102, 228, 0.1)', borderLeft: '2px solid #6ab0ff', padding: '8px', borderRadius: '0 4px 4px 0' }}>
                                                    <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#6ab0ff', marginBottom: '4px' }}>Quản trị viên trả lời:</div>
                                                    <div style={{ fontSize: '12px', color: '#fff', lineHeight: '1.5' }}>{fb.adminReply || fb.AdminReply}</div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Nút bấm nổi */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{ width: '50px', height: '50px', borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg, #4A9FFF, #0c66e4)', color: '#fff', fontSize: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', boxShadow: '0 4px 20px rgba(12, 102, 228, 0.4)', transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                {isOpen ? '✖' : '⭐'}
            </button>
        </div>
    );
};

export default FeedbackWidget;
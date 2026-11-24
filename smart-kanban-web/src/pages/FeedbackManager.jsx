import React, { useState, useEffect } from 'react';
import axios from '../api/axiosConfig';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const FeedbackManager = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 💡 State quản lý ô nhập câu trả lời
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState("");

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        try {
            const res = await axios.get('/api/v1/feedbacks');
            setFeedbacks(res.data);
        } catch (error) {
            toast.error("❌ Lỗi khi tải dữ liệu Đánh giá!", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("⚠️ Sếp có chắc chắn muốn xóa đánh giá này không?")) return;
        try {
            await axios.delete(`/api/v1/feedbacks/${id}`);
            setFeedbacks(feedbacks.filter(fb => (fb.id || fb.Id) !== id));
            toast.success("🗑️ Đã xóa đánh giá thành công!");
        } catch (error) {
            toast.error("❌ Lỗi khi xóa đánh giá!", error);
        }
    };

    // 💡 Hàm gửi câu trả lời
    const handleSendReply = async (id) => {
        if (!replyText.trim()) { toast.warning("⚠️ Vui lòng nhập nội dung trả lời!"); return; }
        try {
            const res = await axios.post(`/api/v1/feedbacks/${id}/reply`, { reply: replyText });
            // Cập nhật lại danh sách ngay lập tức
            setFeedbacks(feedbacks.map(fb => (fb.id || fb.Id) === id ? res.data : fb));
            setReplyingTo(null);
            setReplyText("");
            toast.success("💬 Đã gửi phản hồi thành công!");
        } catch (error) {
            toast.error("❌ Lỗi khi gửi phản hồi!", error);
        }
    };

    const totalFeedbacks = feedbacks.length;
    const averageRating = totalFeedbacks > 0
        ? (feedbacks.reduce((acc, curr) => acc + (curr.rating || curr.Rating), 0) / totalFeedbacks).toFixed(1)
        : 0;

    const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    feedbacks.forEach(fb => {
        const r = fb.rating || fb.Rating;
        if (ratingCounts[r] !== undefined) ratingCounts[r]++;
    });

    return (
        <div style={{ padding: '40px 30px', minHeight: '100%', backgroundColor: 'transparent', fontFamily: 'var(--sans)' }}>
            <style>
                {`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .glass-panel { background: rgba(30, 41, 59, 0.4); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 24px; }
                .fb-card { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 20px; transition: transform 0.2s, box-shadow 0.2s; display: flex; flex-direction: column; justify-content: space-between;}
                .fb-card:hover { transform: translateY(-4px); border-color: rgba(106, 176, 255, 0.3); box-shadow: 0 10px 20px rgba(0,0,0,0.3); }
                .btn-delete { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: all 0.2s; font-size: 12px;}
                .btn-delete:hover { background: #ef4444; color: #fff; }
                .btn-reply { background: rgba(106, 176, 255, 0.1); color: #6ab0ff; border: none; padding: 6px 12px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: all 0.2s; font-size: 12px; }
                .btn-reply:hover { background: #0c66e4; color: #fff; }
                .admin-reply-box { background: rgba(12, 102, 228, 0.1); border-left: 3px solid #6ab0ff; padding: 12px; border-radius: 0 8px 8px 0; margin-top: 16px; }
                `}
            </style>

            <div style={{ maxWidth: '1200px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
                <div style={{ marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#fff', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        ⭐ Quản lý Đánh giá
                    </h1>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px', margin: 0 }}>
                        Lắng nghe phản hồi từ người dùng và trực tiếp giải đáp thắc mắc.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '32px' }}>
                    <div className="glass-panel" style={{ flex: '1 1 300px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', fontWeight: '900', color: '#ffbd2e', lineHeight: '1' }}>{averageRating}</div>
                            <div style={{ display: 'flex', color: '#ffbd2e', fontSize: '18px', justifyContent: 'center', margin: '8px 0' }}>
                                {"★".repeat(Math.round(averageRating))}{"☆".repeat(5 - Math.round(averageRating))}
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>Dựa trên {totalFeedbacks} đánh giá</div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {[5, 4, 3, 2, 1].map(star => {
                                const count = ratingCounts[star];
                                const percent = totalFeedbacks > 0 ? (count / totalFeedbacks) * 100 : 0;
                                return (
                                    <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
                                        <span style={{ width: '12px' }}>{star}</span> <span style={{ color: '#ffbd2e' }}>★</span>
                                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                                            <div style={{ width: `${percent}%`, height: '100%', background: '#ffbd2e', borderRadius: '10px' }}></div>
                                        </div>
                                        <span style={{ width: '20px', textAlign: 'right' }}>{count}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="glass-panel">
                    <h3 style={{ margin: '0 0 20px 0', color: '#fff', fontSize: '18px' }}>📋 Danh sách phản hồi</h3>

                    {isLoading ? (
                        <div style={{ textAlign: 'center', color: '#6ab0ff', padding: '40px 0' }}>⏳ Đang tải dữ liệu...</div>
                    ) : feedbacks.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '40px 0' }}>Chưa có đánh giá nào.</div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
                            {feedbacks.map(fb => {
                                const fbId = fb.id || fb.Id;
                                const hasReplied = fb.adminReply || fb.AdminReply;

                                return (
                                    <div key={fbId} className="fb-card">
                                        <div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${fb.userId || fb.UserId}`} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                                                    <div>
                                                        {/* 💡 SỬ DỤNG TÊN THẬT */}
                                                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '15px' }}>{fb.userName || fb.UserName || 'Người dùng'}</div>
                                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px' }}>{new Date(fb.createdAt || fb.CreatedAt).toLocaleString('vi-VN')}</div>
                                                    </div>
                                                </div>
                                                <div style={{ color: '#ffbd2e', fontSize: '16px', letterSpacing: '1px' }}>
                                                    {"★".repeat(fb.rating || fb.Rating)}
                                                </div>
                                            </div>
                                            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                                                "{fb.comment || fb.Comment || 'Đánh giá không có bình luận.'}"
                                            </p>

                                            {/* 💡 HIỂN THỊ CÂU TRẢ LỜI CỦA SẾP NẾU CÓ */}
                                            {hasReplied && (
                                                <div className="admin-reply-box">
                                                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#6ab0ff', marginBottom: '4px' }}>Sếp đã phản hồi:</div>
                                                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.5' }}>{fb.adminReply || fb.AdminReply}</div>
                                                </div>
                                            )}

                                            {/* 💡 KHUNG NHẬP CÂU TRẢ LỜI MỚI */}
                                            {replyingTo === fbId && (
                                                <div style={{ marginTop: '16px' }}>
                                                    <textarea
                                                        autoFocus
                                                        value={replyText}
                                                        onChange={(e) => setReplyText(e.target.value)}
                                                        placeholder="Nhập câu trả lời của sếp..."
                                                        style={{ width: '100%', height: '60px', padding: '10px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid #6ab0ff', color: '#fff', fontSize: '13px', resize: 'none', boxSizing: 'border-box', outline: 'none' }}
                                                    />
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                                                        <button className="btn-delete" onClick={() => { setReplyingTo(null); setReplyText(''); }}>Hủy</button>
                                                        <button className="btn-reply" style={{ background: '#0c66e4', color: '#fff' }} onClick={() => handleSendReply(fbId)}>Gửi đi</button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px', marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            {/* Nút bật khung trả lời */}
                                            {!hasReplied && replyingTo !== fbId ? (
                                                <button className="btn-reply" onClick={() => { setReplyingTo(fbId); setReplyText(''); }}>💬 Trả lời khách</button>
                                            ) : <div></div>}

                                            <button className="btn-delete" onClick={() => handleDelete(fbId)}>🗑️ Xóa</button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} theme="dark" />
        </div>
    );
};

export default FeedbackManager;
import React, { useState, useEffect, useRef } from 'react';
import TopBar from '../components/TopBar';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from '../api/axiosConfig';
import FeedbackWidget from '../components/FeedbackWidget';

const DashboardLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : { fullName: 'Sếp' };

    const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
    const [workspaces, setWorkspaces] = useState([]);
    const [activeWorkspace, setActiveWorkspace] = useState(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newWsName, setNewWsName] = useState('');

    const workspaceRef = useRef(null);

    // ==========================================================
    // 💡 1. LOAD WORKSPACE TỪ DATABASE VÀ LOCALSTORAGE
    // ==========================================================
    useEffect(() => {
        const fetchWorkspaces = async () => {
            try {
                const res = await axios.get('/api/v1/workspaces');
                setWorkspaces(res.data);
                if (res.data.length > 0) {
                    const savedWsId = localStorage.getItem('activeWorkspaceId');
                    const foundWs = res.data.find(w => (w.id || w.Id) === savedWsId);

                    if (foundWs) {
                        setActiveWorkspace(foundWs);
                    } else {
                        // Nếu chưa có cache, lấy cái đầu tiên và lưu lại
                        setActiveWorkspace(res.data[0]);
                        localStorage.setItem('activeWorkspaceId', res.data[0].id || res.data[0].Id);
                    }
                }
            } catch (error) {
                console.error("Lỗi khi tải Workspace:", error);
            }
        };
        fetchWorkspaces();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (workspaceRef.current && !workspaceRef.current.contains(event.target)) {
                setIsWorkspaceMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ==========================================================
    // 💡 2. HÀM ĐỔI WORKSPACE VÀ TẢI LẠI TRANG
    // ==========================================================
    const handleSelectWorkspace = (ws) => {
        setActiveWorkspace(ws);
        localStorage.setItem('activeWorkspaceId', ws.id || ws.Id);
        setIsWorkspaceMenuOpen(false);
        toast.info(`🔄 Đang chuyển sang: ${ws.name}...`);

        // Tải lại trang sau 1 giây để các Component khác (Bảng, Lịch) gọi lại API với ID mới
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    // ==========================================================
    // 💡 3. TẠO WORKSPACE MỚI GẮN LIỀN VỚI LOCALSTORAGE
    // ==========================================================
    const handleCreateWorkspace = async () => {
        if (!newWsName.trim()) {
            toast.warning("⚠️ Vui lòng nhập tên Workspace!");
            return;
        }
        try {
            const res = await axios.post('/api/v1/workspaces', { name: newWsName });
            setWorkspaces([...workspaces, res.data]);

            // Chuyển sang Workspace vừa tạo và reload
            localStorage.setItem('activeWorkspaceId', res.data.id || res.data.Id);
            setNewWsName('');
            setIsCreateModalOpen(false);
            setIsWorkspaceMenuOpen(false);
            toast.success(`🎉 Đã tạo Không gian làm việc: ${res.data.name}`);

            setTimeout(() => { window.location.reload(); }, 1500);
        } catch (error) {
            toast.error(error.response?.data?.message || "❌ Lỗi tạo Workspace");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user');
        localStorage.removeItem('activeWorkspaceId'); // Xóa luôn cache
        navigate('/login');
    };

    const navLinks = [
        { path: '/d', icon: '📊', label: 'Tổng quan' },
        { path: '/d/boards', icon: '📋', label: 'Quản lý Bảng' },
        { path: '/d/calendar', icon: '📅', label: 'Lịch tiến độ' },
        { path: '/d/members', icon: '👥', label: 'Nhân sự' },
        { path: '/d/analytics', icon: '📈', label: 'Thống kê' },
        { path: '/d/feedbacks', icon: '⭐', label: 'Người dùng góp ý' },
    ];

    const token = localStorage.getItem('jwt_token');
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const activeWsName = activeWorkspace ? (activeWorkspace.name || activeWorkspace.Name) : (currentUser.fullName || 'Workspace');
    const wsFirstLetter = activeWsName ? activeWsName.charAt(0).toUpperCase() : 'W';

    return (
        <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#0f172a', color: '#fff', overflow: 'hidden', fontFamily: 'var(--sans)', position: 'relative' }}>
            <style>
                {`
                .sidebar-link {
                    padding: 14px 20px; color: rgba(255,255,255,0.6); text-decoration: none; font-weight: 600;
                    border-radius: 12px; transition: all 0.3s ease; display: flex; align-items: center; gap: 12px;
                    margin-bottom: 8px; font-size: 15px; border: 1px solid transparent;
                }
                .sidebar-link:hover {
                    background: rgba(255,255,255,0.05); color: #fff; transform: translateX(4px);
                }
                .sidebar-link.active {
                    background: linear-gradient(135deg, rgba(74, 159, 255, 0.15) 0%, rgba(12, 102, 228, 0.15) 100%);
                    color: #6ab0ff; border: 1px solid rgba(106, 176, 255, 0.3); box-shadow: 0 4px 15px rgba(12, 102, 228, 0.1);
                }
                .btn-logout {
                    width: 100%; padding: 14px; background: rgba(255, 95, 86, 0.1); color: #ff5f56;
                    border: 1px solid rgba(255, 95, 86, 0.2); border-radius: 12px; cursor: pointer;
                    font-weight: bold; display: flex; justify-content: center; align-items: center; gap: 10px; transition: all 0.3s ease; font-size: 15px;
                }
                .btn-logout:hover {
                    background: rgba(255, 95, 86, 0.2); transform: translateY(-2px); box-shadow: 0 5px 15px rgba(255, 95, 86, 0.2); color: #fff;
                }
                
                @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes fadeInModal { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                
                .workspace-menu-item {
                    width: 100%; text-align: left; padding: 10px 12px; background: transparent; border: none; color: rgba(255,255,255,0.7);
                    font-size: 13px; font-weight: 600; border-radius: 8px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 10px;
                }
                .workspace-menu-item:hover { background: rgba(255,255,255,0.05); color: #fff; }

                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.4); }
                `}
            </style>

            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }}></div>
            <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(15px)', WebkitBackdropFilter: 'blur(15px)', zIndex: 1 }}></div>
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(12, 102, 228, 0.15) 0%, transparent 60%)', zIndex: 2 }}></div>

            <aside style={{ width: '280px', height: '100%', zIndex: 10, position: 'relative', background: 'rgba(30, 41, 59, 0.4)', borderRight: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', boxShadow: '5px 0 30px rgba(0,0,0,0.2)' }}>
                <Link to="/" style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', transition: 'opacity 0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 0.8} onMouseLeave={e => e.currentTarget.style.opacity = 1}>
                    <div style={{ background: 'linear-gradient(135deg, #4A9FFF 0%, #0c66e4 100%)', minWidth: '38px', height: '38px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '900', fontSize: '16px', color: '#fff', boxShadow: '0 4px 10px rgba(12, 102, 228, 0.4)' }}>SK</div>
                    <span style={{ fontWeight: '800', fontSize: '22px', letterSpacing: '-0.5px', color: '#fff' }}>Smart Kanban</span>
                </Link>

                <nav style={{ flex: 1, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '12px' }}>Menu chính</div>
                    {navLinks.map((link) => {
                        const isActive = link.path === '/d' ? location.pathname === '/d' : location.pathname.includes(link.path);
                        return (
                            <Link key={link.path} to={link.path} className={`sidebar-link ${isActive ? 'active' : ''}`}>
                                <span style={{ fontSize: '20px' }}>{link.icon}</span> {link.label}
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: '20px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <Link to="/" className="sidebar-link" style={{ background: 'rgba(255,255,255,0.05)', marginBottom: '16px', justifyContent: 'center' }}>
                        <span style={{ fontSize: '18px' }}>🌍</span> Về trang chủ
                    </Link>

                    <div style={{ position: 'relative' }} ref={workspaceRef}>
                        <div
                            onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                                background: isWorkspaceMenuOpen ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                                borderRadius: '12px', cursor: 'pointer', border: '1px solid',
                                borderColor: isWorkspaceMenuOpen ? 'rgba(106, 176, 255, 0.3)' : 'rgba(255,255,255,0.05)',
                                transition: 'all 0.2s', marginBottom: '16px'
                            }}
                        >
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #0c66e4 0%, #4A9FFF 100%)', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: '900', fontSize: '18px', boxShadow: '0 4px 10px rgba(12, 102, 228, 0.3)' }}>
                                {wsFirstLetter}
                            </div>
                            <div style={{ overflow: 'hidden', flex: 1 }}>
                                <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginBottom: '2px' }}>{activeWsName}</div>
                                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Workspace</div>
                            </div>
                            <div style={{ color: 'rgba(255,255,255,0.4)', transition: 'transform 0.2s', transform: isWorkspaceMenuOpen ? 'rotate(180deg)' : 'rotate(0)' }}>⬇️</div>
                        </div>

                        {isWorkspaceMenuOpen && (
                            <div style={{ position: 'absolute', bottom: '100%', left: 0, width: '100%', marginBottom: '10px', background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '16px', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)', padding: '12px', zIndex: 100, animation: 'slideUp 0.2s ease-out' }}>
                                <div style={{ padding: '4px 8px 12px 8px', fontSize: '11px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.5px' }}>Workspace của bạn</div>
                                <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '8px' }}>
                                    {workspaces.map(ws => {
                                        const isSelected = activeWorkspace?.id === ws.id || activeWorkspace?.Id === ws.Id;
                                        return (
                                            <div
                                                key={ws.id || ws.Id}
                                                onClick={() => handleSelectWorkspace(ws)}
                                                style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '12px', background: isSelected ? 'rgba(106, 176, 255, 0.1)' : 'transparent', borderRadius: '10px', border: isSelected ? '1px solid rgba(106, 176, 255, 0.2)' : '1px solid transparent', marginBottom: '4px', cursor: 'pointer', transition: 'background 0.2s' }}
                                                onMouseEnter={e => !isSelected && (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                                                onMouseLeave={e => !isSelected && (e.currentTarget.style.background = 'transparent')}
                                            >
                                                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: isSelected ? 'linear-gradient(135deg, #0c66e4, #4A9FFF)' : 'rgba(255,255,255,0.1)', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                                                    {(ws.name || ws.Name || 'W').charAt(0).toUpperCase()}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                                                    <span style={{ color: isSelected ? '#6ab0ff' : '#fff', fontSize: '13px', fontWeight: isSelected ? 'bold' : '500', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{ws.name || ws.Name}</span>
                                                </div>
                                                {isSelected && <span style={{ color: '#6ab0ff', fontSize: '16px', fontWeight: 'bold' }}>✓</span>}
                                            </div>
                                        )
                                    })}
                                </div>

                                <button className="workspace-menu-item" onClick={() => setIsCreateModalOpen(true)}>
                                    <span style={{ fontSize: '16px' }}>➕</span> Tạo Workspace mới
                                </button>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }}></div>
                                <button className="workspace-menu-item" onClick={() => { setIsWorkspaceMenuOpen(false); navigate('/d/settings'); }}>
                                    <span style={{ fontSize: '16px' }}>⚙️</span> Cài đặt tài khoản
                                </button>
                            </div>
                        )}
                    </div>

                    <button onClick={handleLogout} className="btn-logout">
                        <span style={{ fontSize: '18px' }}>🚪</span> Đăng xuất
                    </button>
                </div>
            </aside>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', zIndex: 10, position: 'relative' }}>
                <TopBar />
                <main style={{ flex: 1, overflow: 'auto', position: 'relative', scrollBehavior: 'smooth' }}>
                    <Outlet />
                </main>
            </div>
            <FeedbackWidget />
            {isCreateModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ width: '400px', backgroundColor: 'rgba(30, 41, 59, 0.95)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)', padding: '24px', animation: 'fadeInModal 0.2s ease-out' }}>
                        <h2 style={{ color: '#fff', marginTop: 0, marginBottom: '16px', fontSize: '20px' }}>🚀 Tạo Workspace mới</h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '20px' }}>Một không gian mới để bạn quản lý đội ngũ và các dự án của mình.</p>

                        <label style={{ display: 'block', color: '#fff', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Tên Workspace</label>
                        <input autoFocus value={newWsName} onChange={e => setNewWsName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateWorkspace()} placeholder="Ví dụ: Công ty ABC..." style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: '#fff', outline: 'none', marginBottom: '24px', boxSizing: 'border-box' }} />

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Hủy</button>
                            <button onClick={handleCreateWorkspace} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#0c66e4', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>Tạo ngay</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardLayout;
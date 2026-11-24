import React, { useState, useEffect, useRef } from 'react';

const Checklist = ({ items = [], setItems, isReadOnly, cardAssignees = [], memberMap = {}, canAssignMembers = false, showNoti }) => {
    const [newItemTitle, setNewItemTitle] = useState('');
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const dropdownRef = useRef(null);

    const totalItems = items.length;
    const completedItems = items.filter(item => item.isCompleted || item.IsCompleted).length;
    const progressPercentage = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100);

    // Dùng thông báo nội bộ nếu có, không thì alert tạm
    const notify = (msg, type) => showNoti ? showNoti(msg, type) : alert(msg);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleAddItem = (e) => {
        if (e.key === 'Enter' && newItemTitle.trim()) {
            const validObjectId = [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
            setItems([...items, { id: validObjectId, title: newItemTitle, isCompleted: false, assigneeIds: [] }]);
            setNewItemTitle('');
        }
    };

    const toggleItem = (id) => {
        if (isReadOnly) return;
        setItems(items.map(item => (item.id === id || item.Id === id) ? { ...item, isCompleted: !(item.isCompleted || item.IsCompleted) } : item));
    };

    const deleteItem = (id) => setItems(items.filter(item => (item.id !== id && item.Id !== id)));

    const toggleChecklistAssignee = (itemId, memberId) => {
        if (isReadOnly) return;
        if (!canAssignMembers) {
            notify("Chỉ Sếp (Chủ bảng) hoặc Admin mới có quyền phân công việc này!", "warning");
            return;
        }

        setItems(items.map(item => {
            if (item.id === itemId || item.Id === itemId) {
                let currentList = item.assigneeIds || item.AssigneeIds || [];

                if (typeof (item.assigneeId || item.AssigneeId) === 'string' && (item.assigneeId || item.AssigneeId) !== '') {
                    if (!currentList.includes(item.assigneeId || item.AssigneeId)) {
                        currentList = [...currentList, item.assigneeId || item.AssigneeId];
                    }
                }

                let newList;
                if (currentList.includes(memberId)) {
                    newList = currentList.filter(id => id !== memberId);
                } else {
                    newList = [...currentList, memberId];
                }

                const newItem = { ...item, assigneeIds: newList };
                delete newItem.assigneeId;
                delete newItem.AssigneeId;

                return newItem;
            }
            return item;
        }));
    };

    const clearChecklistAssignees = (itemId) => {
        if (isReadOnly) return;
        if (!canAssignMembers) {
            notify("Chỉ Sếp (Chủ bảng) hoặc Admin mới có quyền gỡ phân công!", "warning");
            return;
        }
        setItems(items.map(item => (item.id === itemId || item.Id === itemId) ? { ...item, assigneeIds: [] } : item));
    };

    const handleAvatarClick = (e, itemId) => {
        e.stopPropagation();
        if (isReadOnly) return;
        if (!canAssignMembers) {
            notify("Chỉ Sếp (Chủ bảng) hoặc Admin mới có quyền phân công việc này!", "warning");
            return;
        }
        if (cardAssignees.length === 0) {
            notify("Hãy thêm 'Người thực hiện' ở Thẻ trước khi phân công Việc nhỏ nhé!", "warning");
            return;
        }
        setOpenDropdownId(openDropdownId === itemId ? null : itemId);
    };

    const progressBarColor = progressPercentage === 100 ? '#20c997' : 'var(--color-accent)';

    return (
        <div style={{ marginBottom: '36px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-secondary)', minWidth: '40px' }}>{progressPercentage}%</span>
                <div style={{ flex: 1, height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${progressPercentage}%`, height: '100%', backgroundColor: progressBarColor, transition: 'width 0.3s ease, background-color 0.3s ease' }}></div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {items.map((item, index) => {
                    const itemId = item.id || item.Id;
                    const isDropdownOpen = openDropdownId === itemId;

                    let currentAssignees = [...(item.assigneeIds || item.AssigneeIds || [])];
                    if (typeof (item.assigneeId || item.AssigneeId) === 'string' && (item.assigneeId || item.AssigneeId) !== '') {
                        if (!currentAssignees.includes(item.assigneeId || item.AssigneeId)) currentAssignees.push(item.assigneeId || item.AssigneeId);
                    }

                    return (
                        <div key={itemId || index} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}>
                            <input type="checkbox" checked={item.isCompleted || item.IsCompleted} onChange={() => toggleItem(itemId)} disabled={isReadOnly} style={{ width: '18px', height: '18px', cursor: isReadOnly ? 'default' : 'pointer', accentColor: 'var(--color-accent)' }} />
                            <span style={{ flex: 1, fontSize: '15px', lineHeight: '1.4', color: (item.isCompleted || item.IsCompleted) ? 'var(--text-secondary)' : 'var(--text-primary)', textDecoration: (item.isCompleted || item.IsCompleted) ? 'line-through' : 'none', transition: 'all 0.2s ease', wordBreak: 'break-word' }}>
                                {item.title || item.Title}
                            </span>

                            <div style={{ position: 'relative' }} ref={isDropdownOpen ? dropdownRef : null}>
                                <div
                                    onClick={(e) => handleAvatarClick(e, itemId)}
                                    title={!canAssignMembers ? "Bạn không có quyền phân công" : "Click để phân công người thực hiện"}
                                    style={{
                                        display: 'flex', alignItems: 'center',
                                        cursor: isReadOnly || !canAssignMembers ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s', padding: '2px', borderRadius: '20px',
                                        background: isDropdownOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        opacity: canAssignMembers ? 1 : 0.6
                                    }}
                                    onMouseEnter={e => !isReadOnly && canAssignMembers && (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                                    onMouseLeave={e => !isReadOnly && canAssignMembers && !isDropdownOpen && (e.currentTarget.style.background = 'transparent')}
                                >
                                    {currentAssignees.length === 0 ? (
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px dashed rgba(255,255,255,0.3)', color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>?</div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            {currentAssignees.slice(0, 3).map((uId, i) => (
                                                <img
                                                    key={uId}
                                                    src={`https://api.dicebear.com/7.x/micah/svg?seed=${uId}`}
                                                    alt="avt"
                                                    title={memberMap[uId] || 'Đồng đội'}
                                                    style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#0c66e4', border: '2px solid var(--bg-header)', marginLeft: i > 0 ? '-10px' : '0', zIndex: 3 - i }}
                                                />
                                            ))}
                                            {currentAssignees.length > 3 && (
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', border: '2px solid var(--bg-header)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff', fontSize: '10px', fontWeight: 'bold', marginLeft: '-10px', zIndex: 0 }}>
                                                    +{currentAssignees.length - 3}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {isDropdownOpen && !isReadOnly && canAssignMembers && (
                                    <div style={{
                                        position: 'absolute', top: '35px', right: 0, width: '220px',
                                        background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 9999, overflow: 'hidden',
                                        display: 'flex', flexDirection: 'column'
                                    }}>
                                        <div style={{ padding: '10px 12px', fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)', textTransform: 'uppercase' }}>
                                            Phân công cho:
                                        </div>
                                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            <div
                                                onClick={(e) => { e.stopPropagation(); clearChecklistAssignees(itemId); }}
                                                style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.2s', color: '#ef4444' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '12px' }}>✖</div>
                                                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Bỏ chọn tất cả</span>
                                            </div>

                                            {cardAssignees.map(memberId => {
                                                const isSelected = currentAssignees.includes(memberId);
                                                return (
                                                    <div
                                                        key={memberId}
                                                        onClick={(e) => { e.stopPropagation(); toggleChecklistAssignee(itemId, memberId); }}
                                                        style={{
                                                            padding: '10px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', transition: 'background 0.2s',
                                                            color: '#fff', background: isSelected ? 'rgba(106, 176, 255, 0.15)' : 'transparent',
                                                            borderLeft: isSelected ? '3px solid #6ab0ff' : '3px solid transparent'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.background = isSelected ? 'rgba(106, 176, 255, 0.25)' : 'rgba(255,255,255,0.05)'}
                                                        onMouseLeave={e => e.currentTarget.style.background = isSelected ? 'rgba(106, 176, 255, 0.15)' : 'transparent'}
                                                    >
                                                        <img src={`https://api.dicebear.com/7.x/micah/svg?seed=${memberId}`} alt="avt" style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0c66e4' }} />
                                                        <span style={{ fontSize: '13px', fontWeight: isSelected ? 'bold' : 'normal', color: isSelected ? '#6ab0ff' : '#fff', flex: 1 }}>
                                                            {memberMap[memberId] || 'Đồng đội'}
                                                        </span>
                                                        {isSelected && <span style={{ color: '#6ab0ff', fontSize: '14px', fontWeight: 'bold' }}>✓</span>}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {!isReadOnly && (
                                <button onClick={() => deleteItem(itemId)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px', padding: '0 4px', lineHeight: '1', marginLeft: '4px' }} title="Xóa">×</button>
                            )}
                        </div>
                    );
                })}
            </div>

            {!isReadOnly && (
                <input value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} onKeyDown={handleAddItem} placeholder="+ Thêm việc cần làm... (Nhấn Enter để lưu)" style={{ width: '100%', padding: '12px 14px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', outline: 'none', fontSize: '14px', boxSizing: 'border-box', transition: 'border-color 0.2s' }} onFocus={(e) => e.target.style.border = '1px solid var(--color-accent)'} onBlur={(e) => e.target.style.border = '1px solid var(--border-color)'} />
            )}
        </div>
    );
}
export default Checklist;
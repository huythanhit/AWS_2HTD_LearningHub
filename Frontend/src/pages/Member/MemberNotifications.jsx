// File: src/pages/Member/MemberNotifications.jsx

import React, { useState, useEffect } from 'react';
import { 
    Bell, Calendar, ClipboardList, CheckCheck, Trash2, 
    Clock, Info, AlertTriangle, Video, ArrowRight, 
    MessageCircle, Wallet, FileText, Zap, X
} from 'lucide-react';
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from '../../services/notificationService';
import { toast } from 'react-toastify';

export default function MemberNotifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    // Load notifications từ API
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setLoading(true);
                const result = await getMyNotifications({ 
                    page: 1, 
                    pageSize: 20,
                    isRead: filter === 'unread' ? false : undefined
                });
                
                // Map dữ liệu từ API sang format của component
                const mappedNotifications = (result.notifications || result.data || result || []).map((notif) => ({
                    id: notif.id || notif.notification_id,
                    type: notif.type || 'info',
                    title: notif.title || notif.subject || '',
                    message: notif.message || notif.body || notif.content || '',
                    time: formatTimeAgo(notif.created_at || notif.createdAt),
                    isRead: notif.is_read || notif.isRead || false,
                    action: notif.action_url ? 'Xem chi tiết' : null,
                    actionUrl: notif.action_url || null
                }));
                
                setNotifications(mappedNotifications);
                setHasMore(result.pagination?.hasMore || false);
            } catch (error) {
                console.error('Error fetching notifications:', error);
                toast.error('Không thể tải thông báo');
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();
    }, [filter]);

    // Helper: Format thời gian
    const formatTimeAgo = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    // --- HELPER FUNCTIONS ---

    // 1. Icon Mapping
    const getIcon = (type) => {
        switch (type) {
            case 'urgent': return <AlertTriangle size={24} />;
            case 'exam': return <ClipboardList size={24} />;
            case 'schedule': return <Video size={24} />;
            case 'payment': return <Wallet size={24} />;
            case 'feedback': return <FileText size={24} />;
            case 'discussion': return <MessageCircle size={24} />;
            case 'promotion': return <Zap size={24} />;
            case 'system': return <Bell size={24} />;
            default: return <Info size={24} />;
        }
    };

    // 2. Color Mapping (Background & Text)
    const getStyle = (type) => {
        switch (type) {
            case 'urgent': return 'bg-red-100 text-red-600 ring-4 ring-red-50';
            case 'exam': return 'bg-orange-100 text-orange-600 ring-4 ring-orange-50';
            case 'schedule': return 'bg-indigo-100 text-indigo-600 ring-4 ring-indigo-50';
            case 'payment': return 'bg-emerald-100 text-emerald-600 ring-4 ring-emerald-50';
            case 'feedback': return 'bg-blue-100 text-blue-600 ring-4 ring-blue-50';
            case 'discussion': return 'bg-pink-100 text-pink-600 ring-4 ring-pink-50';
            case 'promotion': return 'bg-yellow-100 text-yellow-600 ring-4 ring-yellow-50';
            default: return 'bg-gray-100 text-gray-600 ring-4 ring-gray-50';
        }
    };

    // 3. Logic Actions
    const markAsRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
        } catch (error) {
            console.error('Error marking notification as read:', error);
            toast.error('Không thể đánh dấu đã đọc');
        }
    };

    const markAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            toast.success('Đã đánh dấu tất cả là đã đọc');
        } catch (error) {
            console.error('Error marking all as read:', error);
            toast.error('Không thể đánh dấu tất cả là đã đọc');
        }
    };

    const deleteNotification = (id) => {
        // TODO: Gọi API để xóa notification nếu có
        setNotifications(notifications.filter(n => n.id !== id));
    };

    // 4. Filtering
    const filteredList = notifications.filter(n => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !n.isRead;
        // Gom nhóm các loại khác nhau vào 1 tab 'system' nếu muốn, hoặc filter chính xác
        return n.type === filter;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="w-full space-y-8 pb-10">
            
            {/* --- HEADER --- */}
            <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 p-8 rounded-3xl shadow-lg shadow-indigo-200">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-500/20 rounded-full blur-2xl -ml-10 -mb-10"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="text-white">
                        <h1 className="text-3xl font-extrabold mb-2 flex items-center gap-3">
                            Thông báo <span className="bg-white/20 px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-md">{notifications.length} tin</span>
                        </h1>
                        <p className="text-indigo-100 opacity-90">Đừng bỏ lỡ các tin tức quan trọng và lịch học sắp tới.</p>
                    </div>

                    <div className="flex gap-4 bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/20">
                        <div className="px-6 py-3 text-center">
                            <div className="text-3xl font-bold text-white">{unreadCount}</div>
                            <div className="text-[10px] uppercase text-indigo-200 font-bold tracking-wider">Chưa đọc</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- TOOLBAR --- */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 sticky top-4 z-10 bg-[#f8f6fb]/80 backdrop-blur-lg p-2 rounded-2xl">
                {/* Tabs */}
                <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex gap-1 overflow-x-auto max-w-full no-scrollbar">
                    {[
                        { key: 'all', label: 'Tất cả' },
                        { key: 'unread', label: 'Chưa đọc' },
                        { key: 'urgent', label: 'Quan trọng' },
                        { key: 'schedule', label: 'Lịch học' },
                        { key: 'payment', label: 'Tài chính' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-4 py-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-300 ${
                                filter === tab.key
                                ? "bg-[#5a4d8c] text-white shadow-md shadow-indigo-200"
                                : "text-gray-500 hover:bg-gray-50 hover:text-[#5a4d8c]"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Mark All Read Button */}
                {unreadCount > 0 && (
                    <button 
                        onClick={markAllRead}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition shadow-sm"
                    >
                        <CheckCheck size={16} /> Đánh dấu đã đọc hết
                    </button>
                )}
            </div>

            {/* --- LIST NOTIFICATIONS --- */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                            <p className="text-gray-500">Đang tải thông báo...</p>
                        </div>
                    </div>
                ) : filteredList.length > 0 ? (
                    filteredList.map((item) => (
                        <div 
                            key={item.id} 
                            onClick={() => markAsRead(item.id)}
                            className={`group relative p-5 rounded-3xl transition-all duration-300 cursor-pointer overflow-hidden border
                                ${!item.isRead 
                                    ? 'bg-white border-l-4 border-l-indigo-500 border-y-gray-100 border-r-gray-100 shadow-lg shadow-indigo-50 transform scale-[1.01]' 
                                    : 'bg-white/60 border-transparent hover:bg-white hover:shadow-md'
                                }
                            `}
                        >
                            <div className="flex flex-col md:flex-row gap-5 relative z-10">
                                {/* Icon Left */}
                                <div className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${getStyle(item.type)}`}>
                                    {getIcon(item.type)}
                                </div>

                                {/* Content Body */}
                                <div className="flex-1 min-w-0"> {/* min-w-0 giúp text truncate hoạt động tốt */}
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                {!item.isRead && (
                                                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                                )}
                                                <h3 className={`text-base md:text-lg truncate pr-4 ${!item.isRead ? 'font-bold text-gray-900' : 'font-semibold text-gray-600'}`}>
                                                    {item.title}
                                                </h3>
                                            </div>
                                            
                                            <p className={`text-sm md:text-base leading-relaxed mb-3 ${!item.isRead ? 'text-gray-700' : 'text-gray-400'}`}>
                                                {item.message}
                                            </p>
                                        </div>

                                        {/* Delete Button (Hiện khi hover) */}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deleteNotification(item.id); }}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                            title="Xóa thông báo"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>

                                    {/* Footer: Time & Action */}
                                    <div className="flex flex-wrap items-center gap-3 mt-1">
                                        <span className={`text-xs flex items-center font-medium ${!item.isRead ? 'text-indigo-500' : 'text-gray-400'}`}>
                                            <Clock size={14} className="mr-1" /> {item.time}
                                        </span>

                                        {/* Action Button (Nếu có) */}
                                        {item.action && (
                                            <button className={`
                                                ml-auto flex items-center gap-1 text-xs font-bold px-4 py-1.5 rounded-full transition-all
                                                ${!item.isRead 
                                                    ? 'bg-[#8c78ec] text-white hover:bg-[#7a66d3] shadow-md shadow-indigo-200 hover:-translate-y-0.5' 
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                                }
                                            `}>
                                                {item.action} <ArrowRight size={12} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    // Empty State
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-4 animate-bounce-slow">
                            <Bell size={40} className="text-indigo-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-700 mb-2">Không có thông báo nào</h3>
                        <p className="text-gray-500">Bạn đã cập nhật tất cả tin tức mới nhất.</p>
                        {filter !== 'all' && (
                            <button 
                                onClick={() => setFilter('all')}
                                className="mt-4 text-[#8c78ec] font-bold hover:underline"
                            >
                                Quay lại tất cả
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Load More Button */}
            {filteredList.length > 0 && hasMore && (
                <div className="flex justify-center pt-4">
                    <button 
                        onClick={async () => {
                            try {
                                const nextPage = page + 1;
                                const result = await getMyNotifications({ 
                                    page: nextPage, 
                                    pageSize: 20,
                                    isRead: filter === 'unread' ? false : undefined
                                });
                                
                                const mappedNotifications = (result.notifications || result.data || []).map((notif) => ({
                                    id: notif.id || notif.notification_id,
                                    type: notif.type || 'info',
                                    title: notif.title || notif.subject || '',
                                    message: notif.message || notif.body || notif.content || '',
                                    time: formatTimeAgo(notif.created_at || notif.createdAt),
                                    isRead: notif.is_read || notif.isRead || false,
                                    action: notif.action_url ? 'Xem chi tiết' : null,
                                    actionUrl: notif.action_url || null
                                }));
                                
                                setNotifications([...notifications, ...mappedNotifications]);
                                setPage(nextPage);
                                setHasMore(result.pagination?.hasMore || false);
                            } catch (error) {
                                toast.error('Không thể tải thêm thông báo');
                            }
                        }}
                        className="text-gray-400 font-semibold text-sm hover:text-[#5a4d8c] transition flex items-center gap-2"
                    >
                        Xem các thông báo cũ hơn <ArrowRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
}
import { useState, useEffect } from 'react';
import { getMyNotifications } from '../services/notificationService';

/**
 * Hook để lấy số lượng thông báo chưa đọc
 * @returns {Object} { unreadCount, refreshUnreadCount }
 */
export default function useUnreadNotifications() {
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const refreshUnreadCount = async () => {
        try {
            setLoading(true);
            const result = await getMyNotifications({ 
                page: 1, 
                pageSize: 1,
                isRead: false 
            });
            // Lấy total từ pagination
            const total = result.pagination?.total || 0;
            setUnreadCount(total);
        } catch (error) {
            console.error('Error fetching unread count:', error);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshUnreadCount();
        // Refresh mỗi 30 giây
        const interval = setInterval(refreshUnreadCount, 30000);
        return () => clearInterval(interval);
    }, []);

    return { unreadCount, refreshUnreadCount, loading };
}


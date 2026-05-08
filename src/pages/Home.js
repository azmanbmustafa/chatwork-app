import React, { useState, useEffect } from 'react';
import ChatList from '../components/Chat/ChatList';
import ChatWindow from '../components/Chat/ChatWindow';
import { useAuth } from '../contexts/AuthContext';
import { requestNotificationPermission, onForegroundMessage } from '../firebase/messaging';
import '../components/Chat/Chat.css';

export default function Home() {
  const [selectedChat, setSelectedChat] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;
    requestNotificationPermission(currentUser.uid);

    const unsubscribe = onForegroundMessage((payload) => {
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'New message', {
          body: payload.notification?.body,
          icon: '/logo192.png',
        });
      }
    });

    return () => unsubscribe?.();
  }, [currentUser]);

  return (
    <div className="chat-layout">
      <ChatList onSelectChat={setSelectedChat} selectedChatId={selectedChat?.id} />
      <ChatWindow chat={selectedChat} />
    </div>
  );
}

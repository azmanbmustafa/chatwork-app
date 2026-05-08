import React, { useState } from 'react';
import ChatList from '../components/Chat/ChatList';
import ChatWindow from '../components/Chat/ChatWindow';
import '../components/Chat/Chat.css';

export default function Home() {
  const [selectedChat, setSelectedChat] = useState(null);

  return (
    <div className="chat-layout">
      <ChatList onSelectChat={setSelectedChat} selectedChatId={selectedChat?.id} />
      <ChatWindow chat={selectedChat} />
    </div>
  );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Send, User, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function MessagingPanel({ interns, experts }) {
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [messageContent, setMessageContent] = useState('');
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['messages'],
    queryFn: () => base44.entities.Message.list('-created_date')
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setMessageContent('');
    }
  });

  const handleSendMessage = () => {
    if (!selectedRecipient || !messageContent.trim()) return;

    sendMessageMutation.mutate({
      sender_id: 'admin',
      sender_name: 'מנהל',
      recipient_id: selectedRecipient.id,
      recipient_name: selectedRecipient.name,
      content: messageContent
    });
  };

  const allRecipients = [
    ...interns.map(i => ({ ...i, type: 'מתמחה' })),
    ...experts.map(e => ({ ...e, type: 'מומחה' }))
  ];

  const conversationMessages = selectedRecipient
    ? messages.filter(m => 
        (m.sender_id === selectedRecipient.id || m.recipient_id === selectedRecipient.id)
      )
    : [];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-teal-600" />
          תיבת שיחה
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Select Recipient */}
          <div>
            <Select
              value={selectedRecipient?.id}
              onValueChange={(value) => {
                const recipient = allRecipients.find(r => r.id === value);
                setSelectedRecipient(recipient);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="בחר מתמחה או מומחה" />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2 text-xs font-semibold text-slate-500">מתמחים</div>
                {interns.map(intern => (
                  <SelectItem key={`intern-${intern.id}`} value={intern.id}>
                    {intern.name} (מתמחה)
                  </SelectItem>
                ))}
                <div className="p-2 text-xs font-semibold text-slate-500 border-t mt-2">מומחים</div>
                {experts.map(expert => (
                  <SelectItem key={`expert-${expert.id}`} value={expert.id}>
                    {expert.name} (מומחה)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Conversation */}
          {selectedRecipient && (
            <>
              <div className="bg-slate-50 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto space-y-3">
                {conversationMessages.length === 0 ? (
                  <div className="text-center text-slate-500 py-12">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p>אין הודעות עדיין</p>
                  </div>
                ) : (
                  conversationMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sender_id === 'admin'
                            ? 'bg-teal-600 text-white'
                            : 'bg-white border border-slate-200'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <div className={`flex items-center gap-1 text-xs mt-1 ${
                          msg.sender_id === 'admin' ? 'text-teal-100' : 'text-slate-400'
                        }`}>
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(msg.created_date), 'dd/MM/yyyy HH:mm')}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="כתוב הודעה..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="flex-1 min-h-[80px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim()}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
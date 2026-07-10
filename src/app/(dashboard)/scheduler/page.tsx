'use client';

import { useEffect, useState } from 'react';
import { Card, Title, Text, Button, Table, Badge, Flex, TextInput, DatePicker, SelectBox, SelectBoxItem, IconText } from '@tremor/react';
import { CalendarIcon, ClockIcon, PlusIcon, TrashIcon, PencilIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import type { ScheduledMessage } from '@/types';

interface ScheduledMessageWithContact {
  id: string;
  contact_id: string;
  message_text: string;
  media_url?: string;
  media_type?: string;
  scheduled_at: string;
  timezone: string;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled';
  sent_at?: string;
  wamid?: string;
  error_message?: string;
  is_recurring: boolean;
  recurrence_pattern?: any;
  created_at: string;
  contact?: {
    name: string;
    phone: string;
  };
}

export default function SchedulerPage() {
  const [messages, setMessages] = useState<ScheduledMessageWithContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchScheduledMessages();
  }, [filterStatus]);

  async function fetchScheduledMessages() {
    try {
      let query = supabase
        .from('scheduled_messages')
        .select(`
          *,
          contact:contacts (
            name,
            phone
          )
        `)
        .order('scheduled_at', { ascending: true });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;
      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching scheduled messages:', error);
      toast.error('Failed to load scheduled messages');
    } finally {
      setLoading(false);
    }
  }

  async function cancelMessage(id: string) {
    try {
      const { error } = await supabase.rpc('cancel_scheduled_message', { message_id: id });
      if (error) throw error;
      
      toast.success('Message cancelled');
      fetchScheduledMessages();
    } catch (error: any) {
      console.error('Error cancelling message:', error);
      toast.error('Failed to cancel message');
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, any> = {
      pending: 'amber',
      sending: 'blue',
      sent: 'emerald',
      failed: 'red',
      cancelled: 'gray'
    };
    
    return <Badge color={variants[status] || 'gray'}>{status}</Badge>;
  }

  function formatDateTime(dateString: string, timezone: string) {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        timeZone: timezone,
        dateStyle: 'medium',
        timeStyle: 'short'
      });
    } catch {
      return new Date(dateString).toLocaleString();
    }
  }

  return (
    <div className="space-y-6">
      <Flex className="items-start justify-between">
        <div>
          <Title>Scheduled Messages</Title>
          <Text>Manage your upcoming WhatsApp messages</Text>
        </div>
        <Button 
          icon={PlusIcon} 
          onClick={() => setShowModal(true)}
        >
          Schedule Message
        </Button>
      </Flex>

      <Card>
        <Flex className="mb-4">
          <Text>Filter by status:</Text>
          <SelectBox
            value={filterStatus}
            onValueChange={setFilterStatus}
          >
            <SelectBoxItem value="all" text="All" />
            <SelectBoxItem value="pending" text="Pending" />
            <SelectBoxItem value="sending" text="Sending" />
            <SelectBoxItem value="sent" text="Sent" />
            <SelectBoxItem value="failed" text="Failed" />
            <SelectBoxItem value="cancelled" text="Cancelled" />
          </SelectBox>
        </Flex>

        {loading ? (
          <Text>Loading...</Text>
        ) : messages.length === 0 ? (
          <Flex className="justify-center py-8">
            <Text>No scheduled messages found</Text>
          </Flex>
        ) : (
          <Table>
            <Table.Head>
              <Table.HeadCell>Contact</Table.HeadCell>
              <Table.HeadCell>Message</Table.HeadCell>
              <Table.HeadCell>Scheduled At</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell>Type</Table.HeadCell>
              <Table.HeadCell className="text-right">Actions</Table.HeadCell>
            </Table.Head>
            <Table.Body>
              {messages.map((msg) => (
                <Table.Row key={msg.id}>
                  <Table.Cell>
                    <div>
                      <Text className="font-medium">{msg.contact?.name || 'Unknown'}</Text>
                      <Text className="text-sm text-gray-500">{msg.contact?.phone || ''}</Text>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Text className="max-w-md truncate">{msg.message_text}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Flex className="items-center space-x-2">
                      <ClockIcon className="h-4 w-4 text-gray-400" />
                      <Text>{formatDateTime(msg.scheduled_at, msg.timezone)}</Text>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    {getStatusBadge(msg.status)}
                  </Table.Cell>
                  <Table.Cell>
                    {msg.is_recurring ? (
                      <Badge color="purple">Recurring</Badge>
                    ) : (
                      <Badge color="gray">One-time</Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <Flex className="justify-end space-x-2">
                      {msg.status === 'pending' && (
                        <>
                          <Button
                            size="xs"
                            variant="light"
                            icon={PencilIcon}
                            tooltip="Edit"
                          />
                          <Button
                            size="xs"
                            variant="light"
                            color="red"
                            icon={XCircleIcon}
                            onClick={() => cancelMessage(msg.id)}
                            tooltip="Cancel"
                          />
                        </>
                      )}
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Card>

      {/* TODO: Add modal for creating/editing scheduled messages */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg p-6">
            <Title className="mb-4">Schedule a Message</Title>
            <Text className="mb-4">This feature will be implemented in the next iteration.</Text>
            <Flex className="justify-end">
              <Button onClick={() => setShowModal(false)}>Close</Button>
            </Flex>
          </Card>
        </div>
      )}
    </div>
  );
}

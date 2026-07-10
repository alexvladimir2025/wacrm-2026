'use client';

import { useEffect, useState } from 'react';
import { Card, Title, Text, Button, Table, Badge, Flex, SelectBox, SelectBoxItem, IconText } from '@tremor/react';
import { BellIcon, PlusIcon, CheckCircleIcon, XCircleIcon, ClockIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

interface ReminderWithDetails {
  id: string;
  account_id: string;
  contact_id?: string;
  conversation_id?: string;
  title: string;
  description?: string;
  reminder_at: string;
  timezone: string;
  status: 'pending' | 'completed' | 'dismissed' | 'expired';
  is_completed: boolean;
  completed_at?: string;
  completed_by?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  color: string;
  notify_via_push: boolean;
  notify_via_email: boolean;
  notify_via_whatsapp: boolean;
  created_at: string;
  contact?: {
    name: string;
    phone: string;
  };
  conversation?: {
    id: string;
  };
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<ReminderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchReminders();
  }, [filterStatus, filterPriority]);

  async function fetchReminders() {
    try {
      let query = supabase
        .from('reminders')
        .select(`
          *,
          contact:contacts (
            name,
            phone
          ),
          conversation:conversations (
            id
          )
        `)
        .order('reminder_at', { ascending: true });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (filterPriority !== 'all') {
        query = query.eq('priority', filterPriority);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReminders(data || []);
    } catch (error: any) {
      console.error('Error fetching reminders:', error);
      toast.error('Failed to load reminders');
    } finally {
      setLoading(false);
    }
  }

  async function completeReminder(id: string) {
    try {
      const { error } = await supabase.rpc('complete_reminder', { reminder_id: id });
      if (error) throw error;
      
      toast.success('Reminder completed');
      fetchReminders();
    } catch (error: any) {
      console.error('Error completing reminder:', error);
      toast.error('Failed to complete reminder');
    }
  }

  async function dismissReminder(id: string) {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({ status: 'dismissed' })
        .eq('id', id)
        .eq('status', 'pending');
      
      if (error) throw error;
      
      toast.success('Reminder dismissed');
      fetchReminders();
    } catch (error: any) {
      console.error('Error dismissing reminder:', error);
      toast.error('Failed to dismiss reminder');
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, any> = {
      pending: 'amber',
      completed: 'emerald',
      dismissed: 'gray',
      expired: 'red'
    };
    
    return <Badge color={variants[status] || 'gray'}>{status}</Badge>;
  }

  function getPriorityBadge(priority: string) {
    const variants: Record<string, any> = {
      low: 'gray',
      medium: 'blue',
      high: 'orange',
      urgent: 'red'
    };
    
    return <Badge color={variants[priority] || 'gray'}>{priority}</Badge>;
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

  function getPriorityColor(priority: string) {
    const colors: Record<string, string> = {
      low: '#6B7280',
      medium: '#3B82F6',
      high: '#F97316',
      urgent: '#EF4444'
    };
    return colors[priority] || '#6B7280';
  }

  return (
    <div className="space-y-6">
      <Flex className="items-start justify-between">
        <div>
          <Title>Reminders</Title>
          <Text>Track your follow-ups and important tasks</Text>
        </div>
        <Button 
          icon={PlusIcon} 
          onClick={() => setShowModal(true)}
        >
          New Reminder
        </Button>
      </Flex>

      <Card>
        <Flex className="mb-4 space-x-4">
          <div className="flex-1">
            <Text>Filter by status:</Text>
            <SelectBox
              value={filterStatus}
              onValueChange={setFilterStatus}
              className="mt-1"
            >
              <SelectBoxItem value="all" text="All" />
              <SelectBoxItem value="pending" text="Pending" />
              <SelectBoxItem value="completed" text="Completed" />
              <SelectBoxItem value="dismissed" text="Dismissed" />
              <SelectBoxItem value="expired" text="Expired" />
            </SelectBox>
          </div>
          <div className="flex-1">
            <Text>Filter by priority:</Text>
            <SelectBox
              value={filterPriority}
              onValueChange={setFilterPriority}
              className="mt-1"
            >
              <SelectBoxItem value="all" text="All" />
              <SelectBoxItem value="low" text="Low" />
              <SelectBoxItem value="medium" text="Medium" />
              <SelectBoxItem value="high" text="High" />
              <SelectBoxItem value="urgent" text="Urgent" />
            </SelectBox>
          </div>
        </Flex>

        {loading ? (
          <Text>Loading...</Text>
        ) : reminders.length === 0 ? (
          <Flex className="justify-center py-8">
            <div className="text-center">
              <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <Text>No reminders found</Text>
            </div>
          </Flex>
        ) : (
          <Table>
            <Table.Head>
              <Table.HeadCell>Title</Table.HeadCell>
              <Table.HeadCell>Contact</Table.HeadCell>
              <Table.HeadCell>Due Date</Table.HeadCell>
              <Table.HeadCell>Priority</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
              <Table.HeadCell>Notifications</Table.HeadCell>
              <Table.HeadCell className="text-right">Actions</Table.HeadCell>
            </Table.Head>
            <Table.Body>
              {reminders.map((reminder) => (
                <Table.Row key={reminder.id}>
                  <Table.Cell>
                    <div>
                      <Flex className="items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: reminder.color || getPriorityColor(reminder.priority) }}
                        />
                        <Text className="font-medium">{reminder.title}</Text>
                      </Flex>
                      {reminder.description && (
                        <Text className="text-sm text-gray-500 truncate max-w-md">
                          {reminder.description}
                        </Text>
                      )}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {reminder.contact ? (
                      <div>
                        <Text className="font-medium">{reminder.contact.name}</Text>
                        <Text className="text-sm text-gray-500">{reminder.contact.phone}</Text>
                      </div>
                    ) : reminder.conversation ? (
                      <Text className="text-sm text-gray-500">Conversation</Text>
                    ) : (
                      <Text className="text-sm text-gray-500">-</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Flex className="items-center space-x-2">
                      <CalendarIcon className="h-4 w-4 text-gray-400" />
                      <Text>{formatDateTime(reminder.reminder_at, reminder.timezone)}</Text>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    {getPriorityBadge(reminder.priority)}
                  </Table.Cell>
                  <Table.Cell>
                    {getStatusBadge(reminder.status)}
                  </Table.Cell>
                  <Table.Cell>
                    <Flex className="space-x-1">
                      {reminder.notify_via_push && (
                        <IconText 
                          icon={BellIcon} 
                          text="" 
                          tooltip="Push notification"
                        />
                      )}
                      {reminder.notify_via_email && (
                        <IconText 
                          icon={BellIcon} 
                          text="" 
                          tooltip="Email notification"
                        />
                      )}
                      {reminder.notify_via_whatsapp && (
                        <IconText 
                          icon={BellIcon} 
                          text="" 
                          tooltip="WhatsApp notification"
                        />
                      )}
                    </Flex>
                  </Table.Cell>
                  <Table.Cell className="text-right">
                    <Flex className="justify-end space-x-2">
                      {reminder.status === 'pending' && (
                        <>
                          <Button
                            size="xs"
                            variant="light"
                            color="emerald"
                            icon={CheckCircleIcon}
                            onClick={() => completeReminder(reminder.id)}
                            tooltip="Complete"
                          />
                          <Button
                            size="xs"
                            variant="light"
                            color="gray"
                            icon={XCircleIcon}
                            onClick={() => dismissReminder(reminder.id)}
                            tooltip="Dismiss"
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

      {/* TODO: Add modal for creating/editing reminders */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg p-6">
            <Title className="mb-4">Create Reminder</Title>
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

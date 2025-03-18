"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useManufacturer } from '@/hooks/useManufacturer';

export default function NotificationConfigModal({ isOpen, onClose, onSave, initialData, isFormView = false }) {
  const { manufacturer } = useManufacturer();
  const [notification, setNotification] = useState({
    notification_type: initialData?.notification_type || 'email',
    recipient_type: initialData?.recipient_type || 'internal',
    recipient: initialData?.recipient || '',
    subject: initialData?.subject || '',
    message: initialData?.message || '',
    condition: initialData?.condition || 'always',
    manufacturer_id: manufacturer?.id
  });

  // Update config when manufacturer changes
  useEffect(() => {
    if (manufacturer?.id) {
      setNotification(prev => ({
        ...prev,
        manufacturer_id: manufacturer.id
      }));
    }
  }, [manufacturer]);

  const handleSubmit = () => {
    onSave({
      ...notification,
      configured: true,
      type: 'notification',
      label: 'Notification'
    });
    
    if (!isFormView) {
      onClose();
    }
  };

  const renderContent = () => (
    <div className="space-y-6">
      <div>
        <h3 className={isFormView ? "text-lg font-medium mb-4" : "hidden"}>Notification Settings</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="notification-type">Notification Type</Label>
              <Select
                value={notification.notification_type}
                onValueChange={(value) => setNotification(prev => ({ ...prev, notification_type: value }))}
              >
                <SelectTrigger id="notification-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="slack">Slack</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="recipient-type">Recipient Type</Label>
              <Select
                value={notification.recipient_type}
                onValueChange={(value) => setNotification(prev => ({ ...prev, recipient_type: value }))}
              >
                <SelectTrigger id="recipient-type">
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">Internal Team</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="recipient">
              {notification.notification_type === 'email' ? 'Email Address' : 
               notification.notification_type === 'sms' ? 'Phone Number' :
               notification.notification_type === 'slack' ? 'Slack Channel/User' :
               'Webhook URL'}
            </Label>
            <Input
              id="recipient"
              value={notification.recipient}
              onChange={(e) => setNotification(prev => ({ ...prev, recipient: e.target.value }))}
              placeholder={
                notification.notification_type === 'email' ? 'example@company.com' : 
                notification.notification_type === 'sms' ? '+1 555-123-4567' :
                notification.notification_type === 'slack' ? '#channel or @user' :
                'https://webhook.example.com'
              }
            />
          </div>
          
          {(notification.notification_type === 'email' || notification.notification_type === 'sms') && (
            <>
              <div className="space-y-2">
                <Label htmlFor="subject">
                  {notification.notification_type === 'email' ? 'Email Subject' : 'SMS Title'}
                </Label>
                <Input
                  id="subject"
                  value={notification.subject}
                  onChange={(e) => setNotification(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder={
                    notification.notification_type === 'email' ? 'New Order from [Customer]' : 
                    'Order Update'
                  }
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message Content</Label>
                <Textarea
                  id="message"
                  value={notification.message}
                  onChange={(e) => setNotification(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter notification message content here..."
                  rows={5}
                />
                <p className="text-xs text-gray-500">
                  Use variables like [Customer], [OrderNumber], [Total] in your message.
                </p>
              </div>
            </>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="condition">When to Send</Label>
            <Select
              value={notification.condition}
              onValueChange={(value) => setNotification(prev => ({ ...prev, condition: value }))}
            >
              <SelectTrigger id="condition">
                <SelectValue placeholder="Select when to send" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="always">Always</SelectItem>
                <SelectItem value="new_customer">New Customer Orders</SelectItem>
                <SelectItem value="order_above">Orders Above Threshold</SelectItem>
                <SelectItem value="specific_products">Contains Specific Products</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isFormView && (
            <Button 
              onClick={handleSubmit}
              className="w-full mt-4" 
              disabled={!notification.recipient}
            >
              Save Configuration
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (isFormView) {
    return renderContent();
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Notification Settings</DialogTitle>
        </DialogHeader>
        
        {renderContent()}
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!notification.recipient}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
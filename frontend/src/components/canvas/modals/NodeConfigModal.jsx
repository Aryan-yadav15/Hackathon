'use client';

import { useWorkflow } from '@/context/WorkflowContext';
import EmailConfigModal from './EmailConfigModal';
import ProductConfigModal from './ProductConfigModal';
import ConditionalConfigModal from './ConditionalConfigModal';
import PriceAdjustmentConfigModal from './PriceAdjustmentConfigModal';
import NotificationConfigModal from './NotificationConfigModal';
import InvoiceConfigModal from './InvoiceConfigModal';

export default function NodeConfigModal() {
  const { selectedNode, isNodeModalOpen, closeNodeModal } = useWorkflow();

  if (!selectedNode || !isNodeModalOpen) return null;

  const handleSave = (configData) => {
    // Update node data in the parent component
    // This would need to update the nodes state in the canvas
    closeNodeModal();
  };

  const modalProps = {
    isOpen: isNodeModalOpen,
    onClose: closeNodeModal,
    onSave: handleSave,
    initialData: selectedNode.data
  };

  // Render the appropriate modal based on node type
  switch (selectedNode.type) {
    case "email":
      return <EmailConfigModal {...modalProps} />;
    case "product":
      return <ProductConfigModal {...modalProps} />;
    case "conditional":
      return <ConditionalConfigModal {...modalProps} />;
    case "price_adjustment":
      return <PriceAdjustmentConfigModal {...modalProps} />;
    case "notification":
      return <NotificationConfigModal {...modalProps} />;
    case "invoice":
      return <InvoiceConfigModal {...modalProps} />;
    default:
      return null;
  }
} 
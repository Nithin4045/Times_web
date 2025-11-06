import { App } from 'antd';
import { useEffect } from 'react';

type Props = {
  successfulWords: string[];
  duplicates: string[];
  onClose: () => void;
};

const WordPopups = ({
  successfulWords,
  duplicates,
  onClose
}: Props) => {
  const { message } = App.useApp();

  // Helper function to show messages one-by-one
  const showMessagesSequentially = async (words: string[], type: 'success' | 'warning') => {
    for (const word of words) {
      if (type === 'success') {
        message.success(`Word "${word}" has been added successfully!`);
      } else if (type === 'warning') {
        message.warning(`Word "${word}" already exists in the list.`);
      }
      // Add a small delay between messages
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  useEffect(() => {
    const showAllMessages = async () => {
      if (successfulWords.length > 0) {
        await showMessagesSequentially(successfulWords, 'success');
      }

      if (duplicates.length > 0) {
        await showMessagesSequentially(duplicates, 'warning');
      }

      // Call onClose after all messages are shown
      onClose();
    };

    if (successfulWords.length > 0 || duplicates.length > 0) {
      showAllMessages();
    }
  }, [successfulWords, duplicates, onClose, message]);

  return null; // This component doesn't render anything visually
};

export default WordPopups;

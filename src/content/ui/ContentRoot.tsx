import { useEffect, useState } from 'react';
import {
  getContentGroup,
  getShowBubble,
  subscribeContentUi,
} from '../content-ui-bridge';
import { ContentApp } from './ContentApp';
import type { OtpFieldGroup } from '../detector';

interface Handlers {
  onFill: (code: string, group: OtpFieldGroup) => void;
  onFetch: () => void;
  onUseLatestCode: () => void;
}

let handlers: Handlers = {
  onFill: () => {},
  onFetch: () => {},
  onUseLatestCode: () => {},
};

export function setContentHandlers(next: Handlers): void {
  handlers = next;
}

export function ContentRoot() {
  const [group, setGroup] = useState(getContentGroup);
  const [showBubble, setShowBubbleState] = useState(getShowBubble);

  useEffect(() => {
    return subscribeContentUi(() => {
      setGroup(getContentGroup());
      setShowBubbleState(getShowBubble());
    });
  }, []);

  return (
    <ContentApp
      group={group}
      showBubble={showBubble}
      onFill={handlers.onFill}
      onFetch={handlers.onFetch}
      onUseLatestCode={handlers.onUseLatestCode}
    />
  );
}

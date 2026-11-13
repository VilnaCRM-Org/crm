import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { createRef } from 'react';

import type { FormHeaderProps, FormLeadProps, OfflineSubmit } from '@/components/types/ui-form';
import FormLead from '@/components/ui-form/form-lead';
import render from '@tests/unit/utils/render-with-i18n';

const NOTICE_ID = 'form-lead-offline-notice';
const ERROR_TEXT = 'Request failed';

const HEADER: FormHeaderProps = {
  title: 'Title',
  subtitle: 'Subtitle',
  showTitle: true,
  showSubtitle: true,
  titleComponent: 'h1',
};

const RETRY = { label: 'Retry', onClick: jest.fn() };

function offlineOf(online: boolean, noticeId: string | undefined): OfflineSubmit {
  return { online, noticeId, noticeRef: createRef(), submitRef: createRef() };
}

interface LeadOverrides {
  readonly header?: Partial<FormHeaderProps>;
  readonly lead?: Partial<FormLeadProps>;
  readonly online?: boolean;
  readonly live?: boolean;
  readonly withNotice?: boolean;
}

function renderLead({
  header = {},
  lead = {},
  online = true,
  live = true,
  withNotice = true,
}: LeadOverrides = {}): void {
  render(
    <FormLead
      header={{ ...HEADER, ...header }}
      lead={{ error: null, ...lead }}
      offline={offlineOf(online, withNotice ? NOTICE_ID : undefined)}
      liveOfflineNotice={live}
    />
  );
}

function precedes(first: Node, second: Node): boolean {
  return (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
}

describe('FormLead', () => {
  it('renders the title as the requested heading and the subtitle under it', () => {
    renderLead();

    const heading = screen.getByRole('heading', { level: 1, name: 'Title' });
    expect(heading).not.toHaveAttribute('tabindex');
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('hides the title and the subtitle when their flags are off', () => {
    renderLead({ header: { showTitle: false, showSubtitle: false } });

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByText('Subtitle')).not.toBeInTheDocument();
  });

  it('hides an empty title even when its flag is on', () => {
    renderLead({ header: { title: '' } });

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
  });

  it('hides an empty subtitle even when its flag is on', () => {
    renderLead({ header: { subtitle: '' } });

    expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toBeInTheDocument();
    expect(screen.queryByText('Subtitle')).not.toBeInTheDocument();
  });

  it('hands the title its ref and tabindex -1 when no banner is shown at mount', () => {
    const titleRef = jest.fn();
    renderLead({ header: { titleRef } });

    const heading = screen.getByRole('heading', { level: 1, name: 'Title' });
    expect(titleRef).toHaveBeenCalledWith(heading);
    expect(heading).toHaveAttribute('tabindex', '-1');
  });

  it('withholds the title ref but keeps tabindex -1 when the banner is shown at mount', () => {
    const titleRef = jest.fn();
    renderLead({ header: { titleRef }, lead: { error: ERROR_TEXT } });

    expect(titleRef).not.toHaveBeenCalledWith(expect.any(HTMLElement));
    expect(screen.getByRole('heading', { level: 1, name: 'Title' })).toHaveAttribute(
      'tabindex',
      '-1'
    );
  });

  it('orders the title, subtitle, notice, banner and offline status', () => {
    renderLead({ lead: { error: ERROR_TEXT, notice: <p>Notice</p> } });

    const order = [
      screen.getByRole('heading', { level: 1, name: 'Title' }),
      screen.getByText('Subtitle'),
      screen.getByText('Notice'),
      screen.getByRole('alert'),
      screen.getByRole('status'),
    ];
    order.slice(1).forEach((node, index) => {
      expect(precedes(order[index] ?? node, node)).toBe(true);
    });
    expect(screen.getByRole('alert')).toHaveTextContent(ERROR_TEXT);
  });

  it('keeps the offline status mounted while online', () => {
    renderLead();

    expect(screen.getByRole('status')).toHaveAttribute('id', NOTICE_ID);
  });

  it('leaves the offline status out when the form renders no live notice', () => {
    renderLead({ live: false });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('describes the banner action by the rendered offline status while offline', () => {
    renderLead({ online: false, lead: { error: ERROR_TEXT, errorAction: RETRY } });

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('id', NOTICE_ID);
    expect(screen.getByRole('button', { name: 'Retry' })).toHaveAttribute(
      'aria-describedby',
      status.id
    );
  });

  it('leaves the banner action undescribed and available while online', () => {
    renderLead({ lead: { error: ERROR_TEXT, errorAction: RETRY } });

    const action = screen.getByRole('button', { name: 'Retry' });
    expect(action).not.toHaveAttribute('aria-describedby');
    expect(action).not.toHaveAttribute('aria-disabled');
  });

  it('marks the banner action unavailable while offline', () => {
    renderLead({ online: false, lead: { error: ERROR_TEXT, errorAction: RETRY } });

    expect(screen.getByRole('button', { name: 'Retry' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('marks the action unavailable but points at no id when the form renders no notice', () => {
    renderLead({
      online: false,
      live: false,
      withNotice: false,
      lead: { error: ERROR_TEXT, errorAction: RETRY },
    });

    const action = screen.getByRole('button', { name: 'Retry' });
    expect(action).toHaveAttribute('aria-disabled', 'true');
    expect(action).not.toHaveAttribute('aria-describedby');
  });
});

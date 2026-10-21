export type AccountNotice = {
  id: string;
  kind: 'success' | 'error' | 'info';
  title: string;
  text: string;
  action?: 'recover' | 'resend';
};

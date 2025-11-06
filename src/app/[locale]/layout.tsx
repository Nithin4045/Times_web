// app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import ClientLayout from './ClientLayout';

export default async function LocaleLayout(props: {
  children: React.ReactNode;
  // 👇 params is a Promise in this Next version
  params: Promise<{ locale: string }>;
}) {
  const { children, params } = props;
  const { locale } = await params;           // ✅ await before using
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ClientLayout locale={locale}>{children}</ClientLayout>
    </NextIntlClientProvider>
  );
}

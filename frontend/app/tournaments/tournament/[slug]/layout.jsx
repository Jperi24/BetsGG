// app/tournaments/[slug]/layout.jsx
import MainLayout from '@/components/layout/MainLayout';

export default function TournamentLayout({ children }) {
  return <MainLayout>{children}</MainLayout>;
}
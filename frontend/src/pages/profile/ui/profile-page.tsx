import { useParams, useNavigate } from 'react-router-dom';
import { ProfileLayout } from '@widgets/profile-layout';

export function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();

  return <ProfileLayout userId={Number(userId)} onBack={() => navigate(-1)} />;
}

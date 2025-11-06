

// 'use client';
// import { Button, Typography } from 'antd';
// import { useRouter } from 'next/navigation';
// import { signOut, useSession } from "next-auth/react";
// import styles from'./no-exams.module.css'; // Import the CSS file
// import AppLayout from "@/components/evaluate/layout";

// const NoExamsPage = () => {
//   const router = useRouter();
//   const { data: session } = useSession();
//   // if (session) {
//   //   router.push('/');
//   // }
//   return (
//     <AppLayout>
//       <div className={styles["no-exams-container"]}>
//       <Typography.Title level={3}>There is no exam found for you</Typography.Title>
//       <Button type="primary" onClick={() => signOut() } className={styles["back-button"]}>
//         Back to Login
//       </Button>
//     </div>
//     </AppLayout>
//   );
// };

// export default NoExamsPage;


'use client';
import { Button, Typography } from 'antd';
import { useRouter } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import styles from './no-exams.module.css';
import AppLayout from '@/components/evaluate/layout';
// import withAuth from '@/app/hoc/withAuth';

const NoExamsPage = () => {
  const router = useRouter();
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    console.log('signing out')
    router.push('/'); // Redirect to the home page after signing out
  };

  return (
   
      <div className={styles['no-exams-container']}>
        <Typography.Title level={3}>There is no exam found for you</Typography.Title>
        <Button type="primary" onClick={handleSignOut} className={styles['back-button']}>
          Back to Login
        </Button>
      </div>
   
  );
};

export default NoExamsPage;
// export default withAuth(NoExamsPage, ["0","3"]);
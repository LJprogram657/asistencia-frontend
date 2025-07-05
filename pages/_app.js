import '../styles/globals.css';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const handleStart = () => setFade(false);
    const handleComplete = () => setFade(true);
    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);
    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  return (
    <div className={fade ? 'fade-in' : 'fade-out'}>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;

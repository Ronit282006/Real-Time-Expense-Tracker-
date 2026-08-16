import { useEffect, useRef, useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';

interface Props {
  onSuccess: (credentialResponse: any) => void;
  text: 'signin_with' | 'signup_with';
}

export default function GoogleSignInButton({ onSuccess, text }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.floor(el.clientWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ width: '100%', maxWidth: 320, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}
    >
      <GoogleLogin
        onSuccess={onSuccess}
        onError={() => toast.error('Google sign-in failed')}
        theme="outline"
        size="large"
        width={width}
        text={text}
        shape="pill"
      />
    </div>
  );
}

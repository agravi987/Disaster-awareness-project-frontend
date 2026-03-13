/**
 * src/components/PasswordInput.jsx - Password field with visibility toggle
 *
 * Drop-in replacement for a plain <input type="password">.
 * Renders an eye icon button to toggle between masked/visible.
 *
 * Props: all standard <input> HTML attributes are forwarded.
 */

import React, { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

function PasswordInput({ className = '', style = {}, ...props }) {
    const [show, setShow] = useState(false);

    return (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
                {...props}
                type={show ? 'text' : 'password'}
                className={className}
                style={{ width: '100%', paddingRight: '2.75rem', ...style }}
            />
            <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Hide password' : 'Show password'}
                title={show ? 'Hide password' : 'Show password'}
                style={{
                    position: 'absolute',
                    right: '0.75rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    color: 'rgb(var(--text-muted))',
                    transition: 'color 0.15s',
                }}
                tabIndex={-1}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'rgb(var(--text))')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgb(var(--text-muted))')}
            >
                {show ? <FiEyeOff size={18} /> : <FiEye size={18} />}
            </button>
        </div>
    );
}

export default PasswordInput;

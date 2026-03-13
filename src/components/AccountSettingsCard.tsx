import type { AppUser } from '../types/auth';

type AccountSettingsCardProps = {
  user: AppUser | null;
  authEnabled: boolean;
  authLoading: boolean;
  authError: string | null;
  nameDraft: string;
  nameSaving: boolean;
  nameSaveError: string | null;
  onNameChange: (value: string) => void;
  onSaveName: () => void;
  onLogin: () => void;
  onLogout: () => void;
};

export function AccountSettingsCard({
  user,
  authEnabled,
  authLoading,
  authError,
  nameDraft,
  nameSaving,
  nameSaveError,
  onNameChange,
  onSaveName,
  onLogin,
  onLogout,
}: AccountSettingsCardProps) {
  return (
    <section className="account-settings-card">
      <div className="account-settings-header">
        <div>
          <div className="account-settings-label">Player Account</div>
          <div className="account-settings-subtitle">
            {user ? 'Your username powers the public leaderboard.' : 'Sign in to save career stats and appear on the leaderboard.'}
          </div>
        </div>
      </div>

      {authLoading ? (
        <p className="account-settings-note">Checking login status…</p>
      ) : user ? (
        <>
          <div className="account-settings-identity">
            <span className="account-settings-chip">Logged in</span>
            <strong>{user.displayName || user.email || 'Signed in player'}</strong>
          </div>

          <label className="account-settings-input-label" htmlFor="display-name-input">
            Username
          </label>
          <input
            id="display-name-input"
            className="account-settings-input"
            type="text"
            value={nameDraft}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Salespro Name"
          />

          <div className="account-settings-actions">
            <button
              className="account-settings-button primary"
              onClick={onSaveName}
              disabled={nameSaving || !nameDraft.trim()}
              type="button"
            >
              {nameSaving ? 'Saving…' : 'Save Username'}
            </button>
            <button
              className="account-settings-button secondary"
              onClick={onLogout}
              type="button"
            >
              Log Out
            </button>
          </div>

          {nameSaveError && <p className="account-settings-error">{nameSaveError}</p>}
        </>
      ) : (
        <>
          <p className="account-settings-note">
            Guest runs stay local to this session. Sign in to build a persistent profile.
          </p>
          <button
            className="account-settings-button primary"
            onClick={onLogin}
            type="button"
            disabled={authLoading || !authEnabled}
          >
            {authEnabled ? 'Sign in with Google' : 'Sign-in unavailable'}
          </button>
        </>
      )}

      {authError && <p className="account-settings-error">{authError}</p>}
    </section>
  );
}

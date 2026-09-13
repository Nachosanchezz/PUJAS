import { joinRoom } from "@/app/room/actions";
import { ActionForm } from "@/components/action-form";
import { TextField } from "@/components/ui/text-field";
import type { TeamSummary } from "@/lib/room-data";

type JoinFormProps = {
  roomCode: string;
  teams: TeamSummary[];
};

export function JoinForm({ roomCode, teams }: JoinFormProps) {
  return (
    <ActionForm action={joinRoom} submitLabel="Entrar como presidente">
      <input type="hidden" name="roomCode" value={roomCode} />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm text-foreground/70">Elige tu equipo</legend>
        {teams.map((team) => (
          <label
            key={team.id}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-foreground/10 px-4 py-3 transition-colors has-[:checked]:border-brand has-[:checked]:bg-brand/10"
          >
            <span className="flex flex-col">
              <span className="font-semibold">{team.name}</span>
              {team.captain && (
                <span className="text-sm text-foreground/60">Presidente: {team.captain}</span>
              )}
            </span>
            <input type="radio" name="teamId" value={team.id} required className="size-5 accent-brand" />
          </label>
        ))}
      </fieldset>

      <TextField
        label="PIN del equipo"
        name="pin"
        type="password"
        inputMode="numeric"
        pattern="[0-9]{4}"
        maxLength={4}
        required
        autoComplete="one-time-code"
        className="font-mono tracking-[0.5em]"
      />
    </ActionForm>
  );
}

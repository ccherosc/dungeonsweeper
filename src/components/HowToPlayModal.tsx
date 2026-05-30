interface HowToPlayModalProps {
  onClose: () => void;
}

export default function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-title">⚔ How to Play</div>

        <div className="modal-section">
          <h4>THE GOAL</h4>
          <p>Reveal every safe room in the dungeon without triggering a trap. Clear the floor to descend deeper. How deep can you go?</p>
        </div>

        <div className="modal-section">
          <h4>CONTROLS</h4>
          <ul>
            <li><strong>Left-click / Tap</strong> — Explore a room</li>
            <li><strong>Right-click / Long-press</strong> — Plant a torch (flag as dangerous)</li>
          </ul>
        </div>

        <div className="modal-section">
          <h4>THE NUMBERS</h4>
          <p>Each revealed room shows how many hazards lurk in adjacent rooms (up to 8 neighbors). Use the numbers to deduce safe paths.</p>
        </div>

        <div className="modal-section">
          <h4>MODES</h4>
          <ul>
            <li><strong>Classic</strong> — One hazard ends your run instantly.</li>
            <li><strong>Adventure</strong> — You have 3 hearts. Each hazard costs one heart. Three strikes and you fall.</li>
          </ul>
        </div>

        <div className="modal-section">
          <h4>DEPTH SCALING</h4>
          <p>Each floor cleared increases depth. The dungeon grows: bigger boards, more hazards. There is no ceiling.</p>
        </div>

        <button className="btn-secondary modal-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}

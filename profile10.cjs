const fs = require("fs");
const lines = fs.readFileSync("src/screens/ProfileScreen.tsx", "utf8").split("\n");

let lastIdx = -1;
for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].trim() === "</>") { lastIdx = i; break; }
}

const modal = `
      {/* Linked Devices Modal */}
      {showLinkedDevices && (
        <div className="fixed inset-0 z-[200] bg-brand-black/90 backdrop-blur-xl flex items-end">
          <div className="w-full bg-brand-navy rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-brand-text">Linked Devices</h3>
              <button onClick={() => setShowLinkedDevices(false)} className="text-brand-text/40 text-2xl">x</button>
            </div>
            {loadingDevices ? (
              <div className="text-center py-8">
                <p className="text-brand-text/40 font-bold">Loading devices...</p>
              </div>
            ) : linkedDevices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-brand-text/40 font-bold mb-4">No devices registered</p>
                <button
                  onClick={registerCurrentDevice}
                  className="px-6 py-3 bg-brand-primary text-brand-black font-black uppercase tracking-widest text-xs rounded-2xl"
                >
                  Register This Device
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {linkedDevices.map(device => (
                  <div key={device.id} className="bg-brand-card/10 border border-brand-border rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                          <Smartphone className="w-5 h-5 text-brand-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-brand-text">{device.name}</p>
                            {device.isCurrent && <span className="text-[9px] bg-brand-primary text-brand-black px-2 py-0.5 rounded-full font-black">CURRENT</span>}
                          </div>
                          <p className="text-[10px] text-brand-text/40">{device.browser}</p>
                          <p className="text-[9px] text-brand-text/30">Last active: {device.lastActive?.toDate?.()?.toLocaleDateString() || "Recently"}</p>
                        </div>
                      </div>
                      {!device.isCurrent && (
                        <button
                          onClick={() => handleRemoveDevice(device.id)}
                          className="text-[9px] font-black text-red-400 border border-red-400/30 px-2 py-1 rounded-lg"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button
                  onClick={registerCurrentDevice}
                  className="w-full py-3 border-2 border-dashed border-brand-border rounded-2xl text-brand-text/40 font-black uppercase tracking-widest text-xs mt-2"
                >
                  + Register Current Device
                </button>
              </div>
            )}
          </div>
        </div>
      )}`;

lines.splice(lastIdx, 0, modal);
fs.writeFileSync("src/screens/ProfileScreen.tsx", lines.join("\n"), "utf8");
console.log("Done!");

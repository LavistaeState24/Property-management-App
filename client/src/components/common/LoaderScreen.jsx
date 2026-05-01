import Logo from "../../assets/Logo.png";

export default function LoaderScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink bg-glow px-6">
      <div className="rounded-xl border border-gold/20 bg-white/5 px-6 py-4 text-sm tracking-[0.3em] text-gold-2">
        <img
          src={Logo}
          className="h-10 w-auto object-contain sm:h-11"
          alt="Lavista"
        />
      </div>
    </div>
  );
}


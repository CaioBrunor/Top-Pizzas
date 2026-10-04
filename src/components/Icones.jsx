const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export const IconeSacola = (p) => (
  <svg {...base} {...p}>
    <path d="M6 8h12l-1 12H7L6 8z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);

export const IconeFechar = (p) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IconeMais = (p) => (
  <svg {...base} {...p}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconeMenos = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12h14" />
  </svg>
);

export const IconeLixeira = (p) => (
  <svg {...base} {...p}>
    <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" />
  </svg>
);

export const IconeSeta = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const IconeVoltar = (p) => (
  <svg {...base} {...p}>
    <path d="M19 12H5M11 18l-6-6 6-6" />
  </svg>
);

export const IconeCheck = (p) => (
  <svg {...base} {...p}>
    <path d="M5 13l4 4L19 7" />
  </svg>
);

export const IconePainel = (p) => (
  <svg {...base} {...p}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

export const IconeLista = (p) => (
  <svg {...base} {...p}>
    <path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" />
  </svg>
);

export const IconePizza = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3l9 17a24 24 0 0 1-18 0L12 3z" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="9.5" cy="16" r="1" />
    <circle cx="14.5" cy="16" r="1" />
  </svg>
);

export const IconePessoas = (p) => (
  <svg {...base} {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20a6 6 0 0 1 12 0" />
    <path d="M16 5.5a3.2 3.2 0 0 1 0 5M17.5 14.5A6 6 0 0 1 21 20" />
  </svg>
);

export const IconeSair = (p) => (
  <svg {...base} {...p}>
    <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
    <path d="M16 16l4-4-4-4M20 12H10" />
  </svg>
);

export const IconeCadeado = (p) => (
  <svg {...base} {...p}>
    <rect x="4.5" y="10" width="15" height="10" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

export const IconePessoa = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
);

export const IconeBaixar = (p) => (
  <svg {...base} {...p}>
    <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14" />
  </svg>
);

export const IconeSemSinal = (p) => (
  <svg {...base} {...p}>
    <path d="M2 2l20 20" />
    <path d="M8.5 16.4a5 5 0 0 1 7 0" />
    <path d="M5 12.9a10 10 0 0 1 5.2-2.7M19 12.9a10 10 0 0 0-2-1.5" />
    <path d="M2 8.8a15 15 0 0 1 4.2-2.6M22 8.8a15 15 0 0 0-11.3-3.8" />
    <path d="M12 20h.01" />
  </svg>
);

export const IconeChama = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3s5 4 5 9a5 5 0 0 1-10 0c0-2 1-3 1-3s1 2 2 2 0-5 2-8z" />
  </svg>
);

export const IconeMoto = (p) => (
  <svg {...base} {...p}>
    <circle cx="5.5" cy="17" r="3" />
    <circle cx="18.5" cy="17" r="3" />
    <path d="M8.5 17h7l-3-7H8M14 10h4l1.5 4M6 7h4" />
  </svg>
);

export const MarcaFatia = ({ width = 30, height = 30, ...p }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 32 32"
    fill="none"
    aria-hidden="true"
    {...p}
  >
    <path
      d="M16 29.4 L5 9 A 16 16 0 0 1 27 9 Z"
      fill="var(--queijo)"
      stroke="var(--queijo)"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path
      d="M5 9 A 16 16 0 0 1 27 9"
      fill="none"
      stroke="var(--ambar)"
      strokeWidth="3.6"
      strokeLinecap="round"
    />
    <circle cx="11.6" cy="13.4" r="1.75" fill="var(--tomate)" />
    <circle cx="20.3" cy="12.9" r="1.75" fill="var(--tomate)" />
    <circle cx="16" cy="20.2" r="1.5" fill="var(--tomate)" />
    <path
      d="M16.2 16.4 q 2.1 1.5 0 3.1 q -2.1 -1.6 0 -3.1 z"
      fill="var(--manjericao)"
    />
  </svg>
);

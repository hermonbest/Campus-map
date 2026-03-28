<!-- Design System -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>KUE  | Interactive Map</title>
<!-- Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Manrope:wght@600;700;800&amp;display=swap" rel="stylesheet"/>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "tertiary-fixed": "#d4e3ff",
              "surface-tint": "#465f88",
              "on-secondary": "#ffffff",
              "tertiary-container": "#002245",
              "surface-dim": "#d9dadb",
              "inverse-primary": "#aec7f6",
              "surface": "#f8f9fa",
              "primary": "#000a1e",
              "surface-bright": "#f8f9fa",
              "on-error": "#ffffff",
              "primary-fixed": "#d6e3ff",
              "error-container": "#ffdad6",
              "on-tertiary-fixed": "#001c3a",
              "error": "#ba1a1a",
              "surface-container": "#edeeef",
              "on-tertiary-container": "#098af8",
              "on-primary": "#ffffff",
              "background": "#f8f9fa",
              "primary-fixed-dim": "#aec7f6",
              "on-tertiary": "#ffffff",
              "surface-container-highest": "#e1e3e4",
              "on-secondary-fixed-variant": "#574500",
              "outline": "#74777f",
              "on-primary-container": "#708ab5",
              "on-tertiary-fixed-variant": "#004786",
              "on-error-container": "#93000a",
              "surface-container-high": "#e7e8e9",
              "secondary-container": "#fed65b",
              "on-background": "#191c1d",
              "primary-container": "#002147",
              "surface-container-lowest": "#ffffff",
              "inverse-on-surface": "#f0f1f2",
              "secondary-fixed": "#ffe088",
              "secondary-fixed-dim": "#e9c349",
              "on-secondary-fixed": "#241a00",
              "on-primary-fixed-variant": "#2d476f",
              "on-primary-fixed": "#001b3d",
              "tertiary-fixed-dim": "#a5c8ff",
              "outline-variant": "#c4c6cf",
              "on-surface-variant": "#44474e",
              "on-secondary-container": "#745c00",
              "on-surface": "#191c1d",
              "tertiary": "#000b1d",
              "inverse-surface": "#2e3132",
              "secondary": "#735c00",
              "surface-variant": "#e1e3e4",
              "surface-container-low": "#f3f4f5"
            },
            fontFamily: {
              "headline": ["Manrope"],
              "body": ["Inter"],
              "label": ["Inter"]
            },
            borderRadius: {"DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem"},
          },
        },
      }
    </script>
<style>.material-symbols-outlined {
    font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24
    }
.map-bg {
    background-image: url(https://lh3.googleusercontent.com/aida-public/AB6AXuDs0SJHScZoT796emiuScDEwCr7x6YTz4kNhyBqhTGBdT2vsOm9vDJTp2UgBZhNyGZ4FfJKVeDQ7eh2up0XHBD5STqWqaHkhwhE9VT3jpDQNDVkC8we1oho5WAr78mIOHV4474e0bKuus8iE365VMJ1sObDltPcjGqWIrIL3A6ROJKJYZDroWPJch10PJTPH-BFqkOoliJzB1IBxda0hNlRlH2mojMq01_aBKYYb7Jmc79XQGRmYm6S9Y5ZuKuXh5UjPdvV0zhrXts);
    background-size: cover;
    background-position: center
    }
.glass-panel {
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px)
    }
.custom-marker-shadow {
    box-shadow: 0 8px 24px rgba(25, 28, 29, 0.08)
    }</style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-surface font-body text-on-surface selection:bg-secondary-fixed overflow-hidden">
<!-- Top Navigation Anchor (Desktop & Tablet) -->
<header class="fixed top-0 left-0 w-full z-50 bg-[#f8f9fa] dark:bg-[#000a1e] flex justify-between items-center px-6 py-4">
<div class="flex items-center gap-4">
<button class="p-2 hover:bg-[#edeeef] dark:hover:bg-[#002147] transition-colors rounded-full active:scale-95 duration-200">
<span class="material-symbols-outlined text-[#000a1e] dark:text-[#f8f9fa]">menu</span>
</button>
<h1 class="font-manrope font-bold tracking-tighter text-lg text-[#000a1e] dark:text-[#ffffff]">KUE </h1>
</div>
<!-- Integrated Search Bar in Top Bar -->
<div class="hidden md:flex flex-1 max-w-lg mx-12">
<div class="relative w-full">
<div class="absolute inset-y-0 left-4 flex items-center pointer-events-none">
<span class="material-symbols-outlined text-outline">search</span>
</div>
<input class="w-full bg-surface-container-high border-none rounded-full py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-secondary placeholder:text-outline" placeholder="Search buildings, libraries, or faculty offices..." type="text"/>
</div>
</div>
<div class="flex items-center gap-4">
<div class="w-10 h-10 rounded-full overflow-hidden bg-surface-container-highest flex items-center justify-center">
<img alt="Student Portrait" class="w-full h-full object-cover" data-alt="professional headshot of a student with a friendly expression, soft natural library lighting, blurred book stacks background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbVfARQns-ZDQ_3fVZSU23eASnKurtZH5eLO2sefyS4jNAifwAYvn6MPP3MVGXkkEJrl2Xb_2kj5PsMJ1SyAE_YXyYhWS6EvOsPY2pgOTwUOdrLp_t4rqvkrXosv0BxA7Bz5xhaxvUY4d8eQxuCkXbzp0O8QXuevFv7hIBbVK4A8Bx5b6BdOr4PesEDaGJZADbRZLVsbR-wHjdZlgRAX7fpsUBAGAzG5k0btif0fqRcmjfJiYE-dC-M29hGHF_s5zvsn8HGChf75E"/>
</div>
</div>
</header>
<!-- Map Canvas -->
<main class="relative w-full h-screen pt-20">
<!-- The Interactive Map Representation -->
<div class="absolute inset-0 z-0 map-bg" data-alt="high-detail architectural stylized map of a university campus, parchment texture, deep navy water features, gold building outlines, scholarly aesthetic" data-location="Oxford University Campus" style="">
<!-- Custom Marker: Main Library -->
<div class="absolute top-[35%] left-[45%] group cursor-pointer">
<div class="flex flex-col items-center">
<div class="bg-surface-container-lowest custom-marker-shadow px-3 py-1.5 rounded-xl mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
<span class="font-headline text-xs font-extrabold uppercase tracking-widest text-primary">Bodleian Library</span>
</div>
<div class="w-4 h-4 rounded-full bg-primary flex items-center justify-center ring-4 ring-white/20">
<div class="w-1.5 h-1.5 rounded-full bg-secondary"></div>
</div>
</div>
</div>
<!-- Custom Marker: Engineering Dept -->
<div class="absolute top-[55%] left-[60%] group cursor-pointer">
<div class="flex flex-col items-center">
<div class="bg-surface-container-lowest custom-marker-shadow px-3 py-1.5 rounded-xl mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
<span class="font-headline text-xs font-extrabold uppercase tracking-widest text-primary">Engineering Hub</span>
</div>
<div class="w-4 h-4 rounded-full bg-primary flex items-center justify-center ring-4 ring-white/20">
<div class="w-1.5 h-1.5 rounded-full bg-secondary"></div>
</div>
</div>
</div>
<!-- Custom Marker: Student Union -->
<div class="absolute top-[42%] left-[28%] group cursor-pointer">
<div class="flex flex-col items-center">
<div class="bg-surface-container-lowest custom-marker-shadow px-3 py-1.5 rounded-xl mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
<span class="font-headline text-xs font-extrabold uppercase tracking-widest text-primary">Student Union</span>
</div>
<div class="w-6 h-6 rounded-full bg-primary flex items-center justify-center ring-[6px] ring-white/30 scale-125">
<div class="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></div>
</div>
</div>
</div>
<!-- Custom Marker: Great Hall -->
<div class="absolute top-[20%] left-[68%] group cursor-pointer">
<div class="flex flex-col items-center">
<div class="bg-surface-container-lowest custom-marker-shadow px-3 py-1.5 rounded-xl mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
<span class="font-headline text-xs font-extrabold uppercase tracking-widest text-primary">The Great Hall</span>
</div>
<div class="w-4 h-4 rounded-full bg-primary flex items-center justify-center ring-4 ring-white/20">
<div class="w-1.5 h-1.5 rounded-full bg-secondary"></div>
</div>
</div>
</div>
</div>
<!-- Floating UI Overlays -->
<!-- Search Bar (Mobile Only) -->
<div class="md:hidden absolute top-4 left-4 right-4 z-10 px-2">
<div class="bg-[#f8f9fa]/80 glass-panel shadow-lg rounded-full px-4 py-3 flex items-center gap-3">
<span class="material-symbols-outlined text-primary">search</span>
<span class="text-on-surface-variant font-medium text-sm">Search campus landmarks...</span>
</div>
</div>
<!-- Filter Chips (Editorial List Style) -->
<div class="absolute top-24 left-6 flex flex-col gap-3 z-10 max-w-[200px]">
<button class="flex items-center gap-3 bg-surface-container-lowest px-4 py-2.5 rounded-xl shadow-sm hover:bg-surface-container transition-colors group">
<span class="material-symbols-outlined text-secondary text-sm">school</span>
<span class="font-label text-xs uppercase tracking-widest font-bold">Academics</span>
</button>
<button class="flex items-center gap-3 bg-surface-container-lowest px-4 py-2.5 rounded-xl shadow-sm hover:bg-surface-container transition-colors">
<span class="material-symbols-outlined text-secondary text-sm">local_library</span>
<span class="font-label text-xs uppercase tracking-widest font-bold">Libraries</span>
</button>
<button class="flex items-center gap-3 bg-surface-container-lowest px-4 py-2.5 rounded-xl shadow-sm hover:bg-surface-container transition-colors">
<span class="material-symbols-outlined text-secondary text-sm">restaurant</span>
<span class="font-label text-xs uppercase tracking-widest font-bold">Dining</span>
</button>
</div>
<!-- Find My Location FAB -->
<div class="absolute bottom-32 right-8 z-20">
<button class="bg-gradient-to-br from-primary to-primary-container text-on-primary w-14 h-14 rounded-full flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all">
<span class="material-symbols-outlined">my_location</span>
</button>
</div>
<!-- Active Info Card (Asymmetric Layout) -->
<div class="absolute bottom-32 left-8 z-20 w-80">
<div class="bg-surface-container-lowest rounded-xl p-6 shadow-2xl relative overflow-hidden">
<!-- Signature Gold Pillar -->
<div class="absolute left-0 top-6 bottom-6 w-0.5 bg-secondary"></div>
<div class="pl-4">
<p class="font-label text-[10px] uppercase tracking-[0.2em] text-secondary font-bold mb-2">Currently At</p>
<h2 class="font-headline text-xl font-extrabold text-primary mb-1">Radcliffe Camera</h2>
<p class="text-on-surface-variant text-sm font-medium leading-relaxed mb-4">Central campus reading room. Quiet study zone in effect.</p>
<div class="flex items-center gap-4">
<button class="bg-primary text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
<span class="material-symbols-outlined text-xs">directions_walk</span>
                            Navigate
                        </button>
<button class="text-primary text-xs font-bold uppercase tracking-widest">Details</button>
</div>
</div>
</div>
</div>
</main>
<!-- Bottom Navigation Shell -->
<nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-8 pt-4 bg-[#f8f9fa]/80 dark:bg-[#000a1e]/80 backdrop-blur-xl">
<!-- Map (Active) -->
<div class="flex flex-col items-center justify-center bg-[#000a1e] dark:bg-[#fed65b] text-[#ffffff] dark:text-[#000a1e] rounded-full w-12 h-12 active:scale-90 duration-150 cursor-pointer">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">map</span>
</div>
<!-- Notices -->
<div class="flex flex-col items-center justify-center text-[#191c1d] dark:text-[#f8f9fa] opacity-60 hover:opacity-100 transition-opacity active:scale-90 duration-150 cursor-pointer">
<span class="material-symbols-outlined">notifications</span>
<span class="font-inter text-[10px] font-medium uppercase tracking-widest mt-1">Notices</span>
</div>
<!-- Search -->
<div class="flex flex-col items-center justify-center text-[#191c1d] dark:text-[#f8f9fa] opacity-60 hover:opacity-100 transition-opacity active:scale-90 duration-150 cursor-pointer">
<span class="material-symbols-outlined">search</span>
<span class="font-inter text-[10px] font-medium uppercase tracking-widest mt-1">Search</span>
</div>
</nav>
<!-- Sidebar / Drawer (Hidden by default, structure provided) -->
<div class="fixed inset-y-0 left-0 z-[60] flex flex-col h-full w-80 bg-[#f8f9fa] dark:bg-[#000a1e] rounded-r-xl shadow-2xl -translate-x-full transition-transform duration-300">
<div class="p-8 flex items-center gap-4">
<div class="w-12 h-12 rounded-full bg-surface-container overflow-hidden">
<img alt="Student Portrait" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0BlgAmco9T1NKiFJyzzOZwXXleRJJ1OTppaqSIKuQultRh6bLiXB_mdxvYkvEt-CEFsNgSWLlRkVk85ftjOLuqBZ3zPj1T50O4JKgqF4tqNSsY_gDMPKA7Wb2CdnilNuLnSxpkMs6lsAo4ml8ZJ0OqoLOWEOd2AoQGFH91evumlkSWryGlQJLM5EW9W81bDcvSmOs-0DwrzYCXdgzP07APRsIGUd7H5BNlQBs33PsO_e18q_3aIuRWohbrT8MZNFpajdzqy-8SfU"/>
</div>
<div>
<h3 class="font-manrope font-black text-[#000a1e] dark:text-white">Academic Profile</h3>
<p class="font-manrope text-xs text-on-surface-variant">Class of 2025</p>
</div>
</div>
<div class="flex flex-col mt-4">
<div class="px-6 py-4 flex items-center gap-4 text-[#191c1d] dark:text-[#f8f9fa] opacity-70 hover:bg-[#f3f4f5] dark:hover:bg-[#002147] transition-all">
<span class="material-symbols-outlined">calendar_today</span>
<span class="font-manrope text-sm">My Schedule</span>
</div>
<div class="px-6 py-4 flex items-center gap-4 text-[#191c1d] dark:text-[#f8f9fa] opacity-70 hover:bg-[#f3f4f5] dark:hover:bg-[#002147] transition-all">
<span class="material-symbols-outlined">local_library</span>
<span class="font-manrope text-sm">Library</span>
</div>
<div class="px-6 py-4 flex items-center gap-4 text-[#191c1d] dark:text-[#f8f9fa] opacity-70 hover:bg-[#f3f4f5] dark:hover:bg-[#002147] transition-all">
<span class="material-symbols-outlined">contact_page</span>
<span class="font-manrope text-sm">Directory</span>
</div>
<div class="px-6 py-4 flex items-center gap-4 text-[#191c1d] dark:text-[#f8f9fa] opacity-70 hover:bg-[#f3f4f5] dark:hover:bg-[#002147] transition-all mt-auto mb-8">
<span class="material-symbols-outlined">settings</span>
<span class="font-manrope text-sm">Settings</span>
</div>
</div>
</div>
</body></html>

<!-- Campus Map -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>KUE  | Notice Board</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200;400;600;700;800&amp;family=Inter:wght@300;400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "tertiary-fixed": "#d4e3ff",
                        "surface-tint": "#465f88",
                        "on-secondary": "#ffffff",
                        "tertiary-container": "#002245",
                        "surface-dim": "#d9dadb",
                        "inverse-primary": "#aec7f6",
                        "surface": "#f8f9fa",
                        "primary": "#000a1e",
                        "surface-bright": "#f8f9fa",
                        "on-error": "#ffffff",
                        "primary-fixed": "#d6e3ff",
                        "error-container": "#ffdad6",
                        "on-tertiary-fixed": "#001c3a",
                        "error": "#ba1a1a",
                        "surface-container": "#edeeef",
                        "on-tertiary-container": "#098af8",
                        "on-primary": "#ffffff",
                        "background": "#f8f9fa",
                        "primary-fixed-dim": "#aec7f6",
                        "on-tertiary": "#ffffff",
                        "surface-container-highest": "#e1e3e4",
                        "on-secondary-fixed-variant": "#574500",
                        "outline": "#74777f",
                        "on-primary-container": "#708ab5",
                        "on-tertiary-fixed-variant": "#004786",
                        "on-error-container": "#93000a",
                        "surface-container-high": "#e7e8e9",
                        "secondary-container": "#fed65b",
                        "on-background": "#191c1d",
                        "primary-container": "#002147",
                        "surface-container-lowest": "#ffffff",
                        "inverse-on-surface": "#f0f1f2",
                        "secondary-fixed": "#ffe088",
                        "secondary-fixed-dim": "#e9c349",
                        "on-secondary-fixed": "#241a00",
                        "on-primary-fixed-variant": "#2d476f",
                        "on-primary-fixed": "#001b3d",
                        "tertiary-fixed-dim": "#a5c8ff",
                        "outline-variant": "#c4c6cf",
                        "on-surface-variant": "#44474e",
                        "on-secondary-container": "#745c00",
                        "on-surface": "#191c1d",
                        "tertiary": "#000b1d",
                        "inverse-surface": "#2e3132",
                        "secondary": "#735c00",
                        "surface-variant": "#e1e3e4",
                        "surface-container-low": "#f3f4f5"
                    },
                    fontFamily: {
                        "headline": ["Manrope"],
                        "body": ["Inter"],
                        "label": ["Inter"]
                    },
                    borderRadius: {"DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem"},
                },
            },
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .editorial-shadow {
            box-shadow: 0 8px 24px rgba(25, 28, 29, 0.04);
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-surface font-body text-on-surface">
<!-- TopAppBar -->
<header class="fixed top-0 left-0 w-full z-50 bg-[#f8f9fa] dark:bg-[#000a1e] flex justify-between items-center w-full px-6 py-4">
<div class="flex items-center gap-4">
<button class="p-2 text-[#000a1e] dark:text-[#f8f9fa] hover:bg-[#edeeef] dark:hover:bg-[#002147] transition-colors rounded-full">
<span class="material-symbols-outlined">menu</span>
</button>
<h1 class="text-lg font-bold tracking-tighter text-[#000a1e] dark:text-[#ffffff] font-headline uppercase">KUE </h1>
</div>
<div class="flex items-center gap-4">
<div class="hidden md:flex items-center gap-8 mr-6">
<a class="font-inter text-[10px] font-medium uppercase tracking-widest text-[#191c1d] dark:text-[#c4c6cf] hover:opacity-100 transition-opacity" href="#">Map</a>
<a class="font-inter text-[10px] font-medium uppercase tracking-widest text-[#735c00] dark:text-[#fed65b]" href="#">Notices</a>
<a class="font-inter text-[10px] font-medium uppercase tracking-widest text-[#191c1d] dark:text-[#c4c6cf] hover:opacity-100 transition-opacity" href="#">Search</a>
</div>
<img alt="User profile photo" class="w-10 h-10 rounded-full object-cover" data-alt="close-up portrait of a thoughtful university student in a library setting with warm ambient lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDCwNbaQxuLcYHeqtRFTWvsos1gNiURD-Qig33v7SFHicR6POH9locLOIhwyDy-ShUvhD7riNAA1jTa4U10SqVGrcSIknIJV4u7xVxK9NQ9Ez3fSJPu9bH2LcbvhIYC6XxmQ1lU7Xm50DaoFBIPdOcRCwHwigqQ50uzQIPNFRU9ase8j7dnnpXYBP98jMbiJTI1Htse45ejG23FUk4J7Y_scUYv2Lx-wsNplyhmgatsX8OLe4UsXFN7rYp_8iKc86AV_r__ZI_Istc"/>
</div>
</header>
<main class="pt-24 pb-32 px-6 max-w-7xl mx-auto">
<!-- Hero Editorial Section -->
<section class="mb-12">
<p class="font-label text-xs uppercase tracking-[0.2em] text-secondary mb-2">University Hub</p>
<h2 class="font-headline text-5xl md:text-6xl font-extrabold tracking-tighter text-primary max-w-2xl leading-none">
                The Campus Notice Board.
            </h2>
<div class="mt-8 flex flex-wrap gap-3">
<span class="px-4 py-2 bg-primary text-on-primary text-xs font-semibold rounded-full">All Notices</span>
<span class="px-4 py-2 bg-surface-container text-on-surface-variant text-xs font-medium rounded-full hover:bg-surface-container-high transition-colors cursor-pointer">Academic</span>
<span class="px-4 py-2 bg-surface-container text-on-surface-variant text-xs font-medium rounded-full hover:bg-surface-container-high transition-colors cursor-pointer">Social</span>
<span class="px-4 py-2 bg-surface-container text-on-surface-variant text-xs font-medium rounded-full hover:bg-surface-container-high transition-colors cursor-pointer">Administrative</span>
</div>
</section>
<!-- Bento Grid Layout -->
<div class="grid grid-cols-1 md:grid-cols-12 gap-6">
<!-- High Priority Editorial Card -->
<article class="md:col-span-8 group relative overflow-hidden rounded-xl bg-surface-container-lowest editorial-shadow">
<div class="aspect-[16/9] overflow-hidden">
<img alt="Graduation Hall" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" data-alt="expansive view of a historic university graduation hall with sunbeams filtering through high windows and rows of wooden chairs" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7U8vA1-4h9G6PxNSHSlgwYiSNxEiRsW7uWZRAD4A8bP75q2MuJEkvZTrEmvCTkXVaSQ5FHM38v44b7-2iY_EODrJC3UNvHkMuR_NOo1jh-3ZBXaSqaoo6yLjQodCzMhMZL7oDGVVnsiF3SvPCjutRqk9hdrk6cakW9DoavAiW3qeB5Z-E7YtfT0QZmFLZEkntCReH8ymbBdqgmjp5_oI6Ue6Efi9FT4ygiNEXCO3-L_HViCW6cyH2OZsu-xFOEeoVisoJ5IpuRag"/>
</div>
<div class="p-8">
<div class="flex items-center gap-3 mb-4">
<span class="px-2 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider rounded">Admin</span>
<time class="text-xs text-outline font-medium uppercase tracking-widest">Oct 24, 2024</time>
</div>
<h3 class="font-headline text-3xl font-bold text-primary mb-4 leading-tight">Spring Semester Enrollment: Final Deadlines and Guidance</h3>
<p class="text-on-surface-variant leading-relaxed max-w-xl mb-6">
                        Registration portals for the upcoming spring term will close precisely at midnight this Friday. Ensure all prerequisites are verified within the Academic Portal before submission.
                    </p>
<button class="flex items-center gap-2 text-secondary font-bold text-sm group-hover:translate-x-1 transition-transform">
                        Read full announcement <span class="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
</article>
<!-- Secondary Featured Card -->
<article class="md:col-span-4 bg-primary-container text-on-primary-container rounded-xl p-8 flex flex-col justify-between editorial-shadow">
<div>
<span class="material-symbols-outlined text-secondary text-4xl mb-6">local_library</span>
<h3 class="font-headline text-2xl font-bold leading-snug mb-4">24/7 Library Access Commencing Finals Week</h3>
<p class="text-on-primary-container/80 text-sm leading-relaxed">The Central Library will transition to 24-hour operations starting next Monday to support the examination period.</p>
</div>
<div class="mt-8 pt-6 border-t border-on-primary-container/10">
<p class="text-[10px] uppercase tracking-widest font-bold opacity-60">Posted by Library Services</p>
</div>
</article>
<!-- Student Notices: Grid Flow -->
<article class="md:col-span-4 bg-surface-container-lowest rounded-xl p-6 editorial-shadow flex flex-col">
<div class="flex justify-between items-start mb-6">
<span class="px-2 py-1 bg-surface-container text-on-surface-variant text-[10px] font-bold uppercase tracking-wider rounded">Social</span>
<span class="material-symbols-outlined text-outline">push_pin</span>
</div>
<h4 class="font-headline text-xl font-bold text-primary mb-3">Vintage Film Club: Sunset Screening</h4>
<p class="text-on-surface-variant text-sm mb-6 flex-grow">Join us at the North Lawn for a screening of 'Metropolis'. Bring your own blankets and refreshments.</p>
<div class="flex items-center gap-3 mt-auto">
<img alt="Student Avatar" class="w-8 h-8 rounded-full border border-surface-container" data-alt="close-up of a stylish young student with a friendly expression in an outdoor campus setting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrFDqB5B_BcdFiuYQh1Hd-A-dURyMeyRA6i0J92fO5FPKCZjgSYnkvwC9WCfV8sm_E-48Ph_DIE04lyTEt1hMQiw3bbXRZzEBe4DdSWCi6rNOqenDZ4HozK2EDkrE6hMiQToh403RmYJPvriGzkz-64w6h6N0wUt665Yvho8HSl6vZxjUuuqghxjP3nHyHmKhzwtVxW2Swj1S_XaG-lBKvbk9ely5wTEviXWwBhYf-RnWLU-PcFlIy6GOMjsanLvMx_6drSAkotrw"/>
<div>
<p class="text-[10px] font-bold text-primary">Maya Rodriguez</p>
<time class="text-[10px] text-outline uppercase tracking-tighter">2 hours ago</time>
</div>
</div>
</article>
<article class="md:col-span-4 bg-surface-container-lowest rounded-xl p-6 editorial-shadow flex flex-col">
<div class="flex justify-between items-start mb-6">
<span class="px-2 py-1 bg-surface-container text-on-surface-variant text-[10px] font-bold uppercase tracking-wider rounded">Academic</span>
<span class="material-symbols-outlined text-outline">verified</span>
</div>
<h4 class="font-headline text-xl font-bold text-primary mb-3">Turing Fellowships: Now Accepting Applications</h4>
<p class="text-on-surface-variant text-sm mb-6 flex-grow">Undergraduates in CS and Math are invited to apply for the prestigious summer research fellowship program.</p>
<div class="flex items-center gap-3 mt-auto">
<div class="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
<span class="material-symbols-outlined text-on-secondary text-sm">school</span>
</div>
<div>
<p class="text-[10px] font-bold text-primary">STEM Department</p>
<time class="text-[10px] text-outline uppercase tracking-tighter">Oct 22, 2024</time>
</div>
</div>
</article>
<article class="md:col-span-4 bg-surface-container-lowest rounded-xl p-6 editorial-shadow border-l-4 border-secondary">
<div class="flex justify-between items-start mb-4">
<span class="px-2 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-wider rounded">Urgent</span>
</div>
<h4 class="font-headline text-xl font-bold text-primary mb-2">Wi-Fi Maintenance: Science Quadrant</h4>
<p class="text-on-surface-variant text-sm mb-4 leading-relaxed italic">"Expected downtime between 02:00 and 04:00 AM tonight for infrastructure upgrades."</p>
<div class="text-[10px] text-outline font-medium uppercase tracking-widest mt-4">IT Operations • Oct 23</div>
</article>
<!-- Bottom Carousel Component Hint -->
<div class="md:col-span-12 mt-12 overflow-x-hidden">
<h3 class="font-label text-xs uppercase tracking-[0.2em] text-outline mb-6">Upcoming Events</h3>
<div class="flex gap-6 pb-4">
<div class="flex-none w-72 h-48 rounded-xl bg-primary relative overflow-hidden group p-6 flex flex-col justify-end">
<img alt="Event background" class="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-1000" data-alt="abstract blurred background of vibrant stage lights in deep blue and purple tones" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzB31fzaNA59dTvTNKF6HS3CxJaG9kE7iscIhKKUybyy2Paz3M0w2ruQVCVPG3GvQB7cGEZDSdv1ZfHZtFx4ipyQnRYzRpHY2aHPLcVxjeaO1cBa07M60oMrddm0Ojq-72cOdSlLHFws1OY0DuGPXwSdYMhx19vluXET6vKCjgW_dl5GqJpKOrAyiDv5l-EBNEEoTIVVEagRWSziUI3RzYUqXZNOjYC3zIQOtvy7kqm8nsA5GPxUHnUK_JXnoKViIeyHstq-RhsBE"/>
<div class="relative z-10">
<span class="text-[10px] font-bold text-secondary uppercase tracking-widest">Oct 28</span>
<h5 class="text-white font-headline text-lg font-bold">Annual Jazz Night</h5>
</div>
</div>
<div class="flex-none w-72 h-48 rounded-xl bg-secondary relative overflow-hidden group p-6 flex flex-col justify-end">
<img alt="Event background" class="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-1000" data-alt="minimalist architectural shot of a modern glass building reflecting a clear blue sky" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMS5Fm-wCYQvL0C7YB-wn_trWQRCc4zJap8x9uGx3ZRR4l4OiudbQGGywrnlf6KT0ymjB3y0WS9vA8v_7F-sSi3VEs1WNAPCCgiKk1pI7FsQitmYOtwkXFuf-0Rsl-B0uDXqRmIZZIXEAHacpTpS0hXsIMW9MZzo0i02jcm66CMLhroqEHPyUZP1QKQ6Zyt1yFirjRG5Otv6j9c3XJC70ccJ49WsH0ClJHaxbPkbYOX1Hsc6Oxm-XiID3LM_RXr0t5MkntFBZZxPE"/>
<div class="relative z-10">
<span class="text-[10px] font-bold text-primary uppercase tracking-widest">Nov 02</span>
<h5 class="text-primary font-headline text-lg font-bold">Architecture Gala</h5>
</div>
</div>
<div class="flex-none w-72 h-48 rounded-xl bg-surface-container relative overflow-hidden group p-6 flex flex-col justify-end">
<div class="relative z-10">
<span class="text-[10px] font-bold text-outline uppercase tracking-widest">Next Week</span>
<h5 class="text-primary font-headline text-lg font-bold">Career Fair 2024</h5>
</div>
</div>
</div>
</div>
</div>
</main>
<!-- Floating Action Button -->
<button class="fixed bottom-24 right-8 z-[60] w-14 h-14 bg-gradient-to-br from-primary to-primary-container text-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(0,10,30,0.2)] hover:scale-105 active:scale-95 transition-all">
<span class="material-symbols-outlined" style="font-variation-settings: 'wght' 600">add</span>
</button>
<!-- BottomNavBar -->
<nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-8 pt-4 bg-[#f8f9fa]/80 dark:bg-[#000a1e]/80 backdrop-blur-xl">
<div class="fixed bottom-4 left-4 right-4 rounded-full flex justify-around items-center h-16 shadow-[0_8px_24px_rgba(25,28,29,0.04)] bg-surface-container-lowest px-4">
<a class="flex flex-col items-center justify-center text-[#191c1d] dark:text-[#f8f9fa] opacity-60 hover:opacity-100 transition-opacity" href="#">
<span class="material-symbols-outlined">map</span>
<span class="font-inter text-[10px] font-medium uppercase tracking-widest mt-1">Map</span>
</a>
<a class="flex flex-col items-center justify-center bg-[#000a1e] dark:bg-[#fed65b] text-[#ffffff] dark:text-[#000a1e] rounded-full w-12 h-12 active:scale-90 duration-150" href="#">
<span class="material-symbols-outlined">notifications</span>
</a>
<a class="flex flex-col items-center justify-center text-[#191c1d] dark:text-[#f8f9fa] opacity-60 hover:opacity-100 transition-opacity" href="#">
<span class="material-symbols-outlined">search</span>
<span class="font-inter text-[10px] font-medium uppercase tracking-widest mt-1">Search</span>
</a>
</div>
</nav>
</body></html>

<!-- Notice Board -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>KUE  - Search &amp; Discovery</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "tertiary-fixed": "#d4e3ff",
              "surface-tint": "#465f88",
              "on-secondary": "#ffffff",
              "tertiary-container": "#002245",
              "surface-dim": "#d9dadb",
              "inverse-primary": "#aec7f6",
              "surface": "#f8f9fa",
              "primary": "#000a1e",
              "surface-bright": "#f8f9fa",
              "on-error": "#ffffff",
              "primary-fixed": "#d6e3ff",
              "error-container": "#ffdad6",
              "on-tertiary-fixed": "#001c3a",
              "error": "#ba1a1a",
              "surface-container": "#edeeef",
              "on-tertiary-container": "#098af8",
              "on-primary": "#ffffff",
              "background": "#f8f9fa",
              "primary-fixed-dim": "#aec7f6",
              "on-tertiary": "#ffffff",
              "surface-container-highest": "#e1e3e4",
              "on-secondary-fixed-variant": "#574500",
              "outline": "#74777f",
              "on-primary-container": "#708ab5",
              "on-tertiary-fixed-variant": "#004786",
              "on-error-container": "#93000a",
              "surface-container-high": "#e7e8e9",
              "secondary-container": "#fed65b",
              "on-background": "#191c1d",
              "primary-container": "#002147",
              "surface-container-lowest": "#ffffff",
              "inverse-on-surface": "#f0f1f2",
              "secondary-fixed": "#ffe088",
              "secondary-fixed-dim": "#e9c349",
              "on-secondary-fixed": "#241a00",
              "on-primary-fixed-variant": "#2d476f",
              "on-primary-fixed": "#001b3d",
              "tertiary-fixed-dim": "#a5c8ff",
              "outline-variant": "#c4c6cf",
              "on-surface-variant": "#44474e",
              "on-secondary-container": "#745c00",
              "on-surface": "#191c1d",
              "tertiary": "#000b1d",
              "inverse-surface": "#2e3132",
              "secondary": "#735c00",
              "surface-variant": "#e1e3e4",
              "surface-container-low": "#f3f4f5"
            },
            fontFamily: {
              "headline": ["Manrope"],
              "body": ["Inter"],
              "label": ["Inter"]
            },
            borderRadius: {"DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem"},
          },
        },
      }
    </script>
<style>
      .material-symbols-outlined {
        font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        display: inline-block;
        line-height: 1;
        text-transform: none;
        letter-spacing: normal;
        word-wrap: normal;
        white-space: nowrap;
        direction: ltr;
      }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-surface text-on-surface font-body selection:bg-secondary-container selection:text-on-secondary-container">
<!-- TopAppBar -->
<header class="fixed top-0 left-0 w-full z-50 bg-[#f8f9fa] dark:bg-[#000a1e] flex justify-between items-center px-6 py-4">
<div class="flex items-center gap-4">
<button class="text-[#000a1e] dark:text-[#f8f9fa] hover:bg-[#edeeef] dark:hover:bg-[#002147] transition-colors p-2 rounded-full active:scale-95 duration-200">
<span class="material-symbols-outlined" data-icon="menu">menu</span>
</button>
<h1 class="text-lg font-bold tracking-tighter text-[#000a1e] dark:text-[#ffffff] font-headline">KUE </h1>
</div>
<div class="h-10 w-10 rounded-full overflow-hidden border-2 border-surface-container">
<img alt="Student Portrait" class="w-full h-full object-cover" data-alt="portrait of a young student with glasses in a library setting, soft academic lighting, professional photography style" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCMQ9op2jUONdMsx7NYLRWRikB61HNuKDTmEdjKbvg9rfuR4oubpFNlsL4nvgF5o7RXzJkZsvQSWsEC7ZuFQe_7oUNF4hL83GAL9Hjp7zuDdBRq96HjBVGiqCkvBVPsJXiCb2KwrNVpVs4VoKMPhCNdY6h89vvOWN4D75wkYO86Wr6_J9wP4Z5DjrzXM31bG56Jy4BU8XqLLVr3y8zq7mO7ghB0XoGioT5U4dxjsp4sEH9GyVFMtdA5E6x71kdl08ejK2k6Bu_eSWI"/>
</div>
</header>
<main class="pt-24 pb-32 px-6 max-w-5xl mx-auto">
<!-- Search Section -->
<section class="mb-12">
<div class="relative group">
<div class="absolute inset-y-0 left-5 flex items-center pointer-events-none">
<span class="material-symbols-outlined text-outline" data-icon="search">search</span>
</div>
<input class="w-full h-16 pl-14 pr-6 bg-surface-container-highest border-none rounded-xl focus:ring-0 focus:bg-surface-container-lowest transition-all duration-300 font-headline text-lg placeholder:text-outline/50" placeholder="Find departments, labs, or faculty..." type="text"/>
<div class="absolute bottom-0 left-0 w-0 h-[2px] bg-secondary transition-all duration-500 group-focus-within:w-full"></div>
</div>
<!-- Filter Chips -->
<div class="mt-6 flex gap-3 overflow-x-auto no-scrollbar pb-2">
<button class="px-6 py-2.5 bg-primary text-on-primary rounded-full text-sm font-medium whitespace-nowrap active:scale-95 transition-transform">Buildings</button>
<button class="px-6 py-2.5 bg-surface-container-high text-on-surface hover:bg-surface-container-highest rounded-full text-sm font-medium whitespace-nowrap active:scale-95 transition-transform">Events</button>
<button class="px-6 py-2.5 bg-surface-container-high text-on-surface hover:bg-surface-container-highest rounded-full text-sm font-medium whitespace-nowrap active:scale-95 transition-transform">Services</button>
<button class="px-6 py-2.5 bg-surface-container-high text-on-surface hover:bg-surface-container-highest rounded-full text-sm font-medium whitespace-nowrap active:scale-95 transition-transform">Faculties</button>
<button class="px-6 py-2.5 bg-surface-container-high text-on-surface hover:bg-surface-container-highest rounded-full text-sm font-medium whitespace-nowrap active:scale-95 transition-transform">Study Spaces</button>
</div>
</section>
<div class="grid grid-cols-1 md:grid-cols-12 gap-8">
<!-- Trending & Recent (Left Column) -->
<div class="md:col-span-4 space-y-10">
<div>
<h2 class="font-headline font-bold text-sm uppercase tracking-widest text-outline mb-6">Recent Searches</h2>
<ul class="space-y-4">
<li class="flex items-center gap-3 text-on-surface/80 hover:text-on-surface transition-colors cursor-pointer group">
<span class="material-symbols-outlined text-sm opacity-40 group-hover:opacity-100" data-icon="history">history</span>
<span class="text-sm font-medium">Main Library Level 3</span>
</li>
<li class="flex items-center gap-3 text-on-surface/80 hover:text-on-surface transition-colors cursor-pointer group">
<span class="material-symbols-outlined text-sm opacity-40 group-hover:opacity-100" data-icon="history">history</span>
<span class="text-sm font-medium">Bio-Engineering Dept.</span>
</li>
<li class="flex items-center gap-3 text-on-surface/80 hover:text-on-surface transition-colors cursor-pointer group">
<span class="material-symbols-outlined text-sm opacity-40 group-hover:opacity-100" data-icon="history">history</span>
<span class="text-sm font-medium">Student Union Café</span>
</li>
</ul>
</div>
<div class="bg-surface-container rounded-xl p-6">
<h2 class="font-headline font-bold text-sm uppercase tracking-widest text-on-surface mb-6">Trending Topics</h2>
<div class="space-y-4">
<div class="flex flex-col gap-1 border-l-2 border-secondary pl-4">
<span class="text-[10px] font-bold text-secondary uppercase tracking-tighter">Campus News</span>
<span class="font-headline font-semibold text-primary">Annual Research Symposium</span>
</div>
<div class="flex flex-col gap-1 border-l-2 border-outline-variant/30 pl-4 hover:border-secondary transition-colors cursor-pointer">
<span class="text-[10px] font-bold text-outline uppercase tracking-tighter">Admissions</span>
<span class="font-headline font-semibold text-primary">Fall Enrollment Dates</span>
</div>
<div class="flex flex-col gap-1 border-l-2 border-outline-variant/30 pl-4 hover:border-secondary transition-colors cursor-pointer">
<span class="text-[10px] font-bold text-outline uppercase tracking-tighter">Facilities</span>
<span class="font-headline font-semibold text-primary">Gym Renovation Schedule</span>
</div>
</div>
</div>
</div>
<!-- Curated Discovery (Right Column - Bento Style) -->
<div class="md:col-span-8">
<h2 class="font-headline font-bold text-sm uppercase tracking-widest text-outline mb-6">Curated For You</h2>
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
<!-- Feature Card (Large) -->
<div class="sm:col-span-2 relative h-64 rounded-xl overflow-hidden group cursor-pointer shadow-sm">
<img alt="Department Highlight" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" data-alt="Modern architectural university building with large glass windows and green courtyard at twilight, elegant lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvRew7f225xNxDDk3lsdesvCJMKDHXmJ5kUQ7Ny6lpQBQA3wp82Lm6SSBIHDzpL3wHVr5piQswoBhwmmdN8NMJnhOvgZDbXDlH9o1pInjr6266-BYVWv65MTRc8IH6Zb2Mr9jRGe3Se7sP3RrML83oox9BNmYwu3R29YHRjc4QPv_VLtEKQKuIS7502-Fy65A8Uw77YhRd-6aH-tI31-MmfpopgVqpRZ0XwFANJpl2JVgj2JBrxgmxf7SBS-rCjGVM-_TClfguLWY"/>
<div class="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent"></div>
<div class="absolute bottom-6 left-6 right-6">
<span class="inline-block px-3 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase tracking-widest rounded-full mb-3">Featured Department</span>
<h3 class="font-headline text-2xl font-bold text-white mb-1">School of Visual Arts</h3>
<p class="text-white/70 text-sm">Explore the new digital media galleries and studio spaces.</p>
</div>
</div>
<!-- Small Info Card -->
<div class="bg-surface-container-lowest p-6 rounded-xl hover:shadow-xl transition-shadow duration-300 border border-outline-variant/10">
<div class="w-12 h-12 rounded-full bg-secondary-container/30 flex items-center justify-center text-secondary mb-4">
<span class="material-symbols-outlined" data-icon="local_library">local_library</span>
</div>
<h4 class="font-headline font-bold text-primary mb-1 text-lg">Central Library</h4>
<p class="text-outline text-sm mb-4">Current Capacity: 42% (Quiet Zone Available)</p>
<button class="text-secondary font-bold text-xs uppercase tracking-widest flex items-center gap-2 group">
                            Check Availability
                            <span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform" data-icon="arrow_forward">arrow_forward</span>
</button>
</div>
<!-- Small Info Card -->
<div class="bg-surface-container-lowest p-6 rounded-xl hover:shadow-xl transition-shadow duration-300 border border-outline-variant/10">
<div class="w-12 h-12 rounded-full bg-primary-container/10 flex items-center justify-center text-primary mb-4">
<span class="material-symbols-outlined" data-icon="restaurant">restaurant</span>
</div>
<h4 class="font-headline font-bold text-primary mb-1 text-lg">Dining Hall</h4>
<p class="text-outline text-sm mb-4">Menu: Tuscan Night Theme Special</p>
<button class="text-secondary font-bold text-xs uppercase tracking-widest flex items-center gap-2 group">
                            View Menu
                            <span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform" data-icon="arrow_forward">arrow_forward</span>
</button>
</div>
<!-- Long Horizontal Notice -->
<div class="sm:col-span-2 bg-[#000a1e] p-6 rounded-xl flex items-center justify-between text-white">
<div class="flex items-center gap-5">
<div class="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center">
<span class="material-symbols-outlined text-secondary text-3xl" data-icon="campaign" style="font-variation-settings: 'FILL' 1;">campaign</span>
</div>
<div>
<h4 class="font-headline font-bold text-lg">IT Maintenance Notice</h4>
<p class="text-white/60 text-sm">Main Campus Wi-Fi down Sunday 2AM-4AM</p>
</div>
</div>
<span class="material-symbols-outlined text-white/40 cursor-pointer hover:text-white transition-colors" data-icon="close">close</span>
</div>
</div>
</div>
</div>
</main>
<!-- BottomNavBar -->
<nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-8 pt-4 bg-[#f8f9fa]/80 dark:bg-[#000a1e]/80 backdrop-blur-xl">
<button class="flex flex-col items-center justify-center text-[#191c1d] dark:text-[#f8f9fa] opacity-60 hover:opacity-100 transition-opacity active:scale-90 duration-150">
<span class="material-symbols-outlined" data-icon="map">map</span>
<span class="font-inter text-[10px] font-medium uppercase tracking-widest mt-1">Map</span>
</button>
<button class="flex flex-col items-center justify-center text-[#191c1d] dark:text-[#f8f9fa] opacity-60 hover:opacity-100 transition-opacity active:scale-90 duration-150">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
<span class="font-inter text-[10px] font-medium uppercase tracking-widest mt-1">Notices</span>
</button>
<button class="flex flex-col items-center justify-center bg-[#000a1e] dark:bg-[#fed65b] text-[#ffffff] dark:text-[#000a1e] rounded-full w-12 h-12 active:scale-90 duration-150 shadow-lg">
<span class="material-symbols-outlined" data-icon="search" style="font-variation-settings: 'FILL' 1;">search</span>
</button>
</nav>
<!-- Navigation Drawer (Hidden by default, structure provided) -->
<aside class="fixed inset-y-0 left-0 z-[60] flex flex-col h-full w-80 rounded-r-xl bg-[#f8f9fa] dark:bg-[#000a1e] shadow-2xl -translate-x-full transition-transform duration-300">
<div class="p-8 border-b border-surface-container">
<div class="flex items-center gap-4 mb-6">
<div class="w-12 h-12 rounded-full overflow-hidden bg-surface-container">
<img alt="Student Portrait" class="w-full h-full object-cover" data-alt="student profile picture" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXPIpaTltxLhhp3cm56XixjhrbDfItI9xhQKHLAu86fMN-9LziNE8-Pmi3rjFpYcKaTc40XhasO5q0hcXIWqlVfOCQnQRra1m9veR2lUDDQKNlSTTNhElv1IWP6fTPFqmlO1dGMR4DPjlt9rBIKFd7a119r988Z1XcT5j49dpZ9BfAoB4x6b4Ozl85xLhGFICZoIx2In4dYzr3Pkg6mP9bmL_UWlvr9ELdmp3h3RsfS8pFfwCRLOkAEQoYhFGble3B3qY679NNE3Q"/>
</div>
<div>
<h5 class="font-headline font-bold text-primary">Academic Profile</h5>
<p class="text-xs text-outline font-medium">Undergraduate • 2025</p>
</div>
</div>
</div>
<nav class="flex-1 py-6 px-4 space-y-2">
<a class="flex items-center gap-4 px-4 py-3 rounded-lg text-[#191c1d] dark:text-[#f8f9fa] opacity-70 hover:bg-[#f3f4f5] dark:hover:bg-[#002147] transition-all" href="#">
<span class="material-symbols-outlined" data-icon="calendar_today">calendar_today</span>
<span class="font-manrope text-sm font-medium">My Schedule</span>
</a>
<a class="flex items-center gap-4 px-4 py-3 rounded-lg text-[#191c1d] dark:text-[#f8f9fa] opacity-70 hover:bg-[#f3f4f5] dark:hover:bg-[#002147] transition-all" href="#">
<span class="material-symbols-outlined" data-icon="local_library">local_library</span>
<span class="font-manrope text-sm font-medium">Library</span>
</a>
<a class="flex items-center gap-4 px-4 py-3 rounded-lg text-[#191c1d] dark:text-[#f8f9fa] opacity-70 hover:bg-[#f3f4f5] dark:hover:bg-[#002147] transition-all" href="#">
<span class="material-symbols-outlined" data-icon="contact_page">contact_page</span>
<span class="font-manrope text-sm font-medium">Directory</span>
</a>
<a class="flex items-center gap-4 px-4 py-3 rounded-lg text-[#191c1d] dark:text-[#f8f9fa] opacity-70 hover:bg-[#f3f4f5] dark:hover:bg-[#002147] transition-all" href="#">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
<span class="font-manrope text-sm font-medium">Settings</span>
</a>
</nav>
</aside>
</body></html>

<!-- Search & Discover -->
<!DOCTYPE html>

<html class="light" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Building Detail - KUE </title>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Google Fonts: Manrope & Inter -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;family=Manrope:wght@600;700;800&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "tertiary-fixed": "#d4e3ff",
              "surface-tint": "#465f88",
              "on-secondary": "#ffffff",
              "tertiary-container": "#002245",
              "surface-dim": "#d9dadb",
              "inverse-primary": "#aec7f6",
              "surface": "#f8f9fa",
              "primary": "#000a1e",
              "surface-bright": "#f8f9fa",
              "on-error": "#ffffff",
              "primary-fixed": "#d6e3ff",
              "error-container": "#ffdad6",
              "on-tertiary-fixed": "#001c3a",
              "error": "#ba1a1a",
              "surface-container": "#edeeef",
              "on-tertiary-container": "#098af8",
              "on-primary": "#ffffff",
              "background": "#f8f9fa",
              "primary-fixed-dim": "#aec7f6",
              "on-tertiary": "#ffffff",
              "surface-container-highest": "#e1e3e4",
              "on-secondary-fixed-variant": "#574500",
              "outline": "#74777f",
              "on-primary-container": "#708ab5",
              "on-tertiary-fixed-variant": "#004786",
              "on-error-container": "#93000a",
              "surface-container-high": "#e7e8e9",
              "secondary-container": "#fed65b",
              "on-background": "#191c1d",
              "primary-container": "#002147",
              "surface-container-lowest": "#ffffff",
              "inverse-on-surface": "#f0f1f2",
              "secondary-fixed": "#ffe088",
              "secondary-fixed-dim": "#e9c349",
              "on-secondary-fixed": "#241a00",
              "on-primary-fixed-variant": "#2d476f",
              "on-primary-fixed": "#001b3d",
              "tertiary-fixed-dim": "#a5c8ff",
              "outline-variant": "#c4c6cf",
              "on-surface-variant": "#44474e",
              "on-secondary-container": "#745c00",
              "on-surface": "#191c1d",
              "tertiary": "#000b1d",
              "inverse-surface": "#2e3132",
              "secondary": "#735c00",
              "surface-variant": "#e1e3e4",
              "surface-container-low": "#f3f4f5"
            },
            fontFamily: {
              "headline": ["Manrope"],
              "body": ["Inter"],
              "label": ["Inter"]
            },
            borderRadius: {"DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem"},
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .editorial-shadow {
            shadow: 0 8px 24px rgba(25, 28, 29, 0.04);
        }
        .glass-nav {
            backdrop-filter: blur(20px);
        }
    </style>
<style>
    body {
      min-height: max(884px, 100dvh);
    }
  </style>
  </head>
<body class="bg-surface font-body text-on-surface selection:bg-secondary-container selection:text-on-secondary-container">
<!-- TopAppBar -->
<header class="fixed top-0 left-0 w-full z-50 bg-[#f8f9fa] dark:bg-[#000a1e] flex justify-between items-center px-6 py-4">
<div class="flex items-center gap-4">
<button class="material-symbols-outlined text-[#000a1e] dark:text-[#f8f9fa] hover:bg-[#edeeef] dark:hover:bg-[#002147] transition-colors p-2 rounded-full active:scale-95 duration-200" data-icon="arrow_back">arrow_back</button>
<h1 class="text-lg font-bold tracking-tighter text-[#000a1e] dark:text-[#ffffff] font-headline">KUE </h1>
</div>
<div class="w-10 h-10 rounded-full bg-surface-container overflow-hidden">
<img alt="User profile photo" class="w-full h-full object-cover" data-alt="Close up portrait of a young male student with glasses in a university library setting, soft natural lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC04ne5a1Z-VI_BUIb5VCaCzn4ET4uItkhKYL2-Dj57jn-frAw6px9eRjKDAvSRQMfk5GaYkKDwwMaXy8q3MBgUYkuIL0QY0G4EuDze7aWnIrUqemnlePXkwKvGatGxNrRfBf8oY3vep-mozTwRRiYdXgYiO0FZfPZ3231ogMQgspT4Sz1X-XdcCtTWqu06QEL7BVXSQ040oUgHoEd3U_RnfZgbq06cnOvHXR7Uc3TzLcLZhQzifestukGOsL5vdtlk35uKfa8fmqE"/>
</div>
</header>
<main class="pt-24 pb-32 px-6 max-w-5xl mx-auto space-y-12">
<!-- Hero Section: Asymmetric Layout -->
<section class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
<div class="md:col-span-7 space-y-6">
<div class="space-y-2">
<span class="font-label text-[0.75rem] uppercase tracking-widest text-secondary font-bold">Architecture &amp; Design</span>
<h2 class="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-primary leading-tight">Mies van der Rohe Pavilion</h2>
</div>
<p class="text-body-lg text-on-surface-variant leading-relaxed max-w-xl">
                    A cornerstone of modernist educational architecture, the pavilion serves as a hub for graduate research and digital fabrication. Its glass-and-steel framework provides an inspiring environment for the next generation of architects and urban planners.
                </p>
<div class="flex flex-wrap gap-4 pt-4">
<button class="bg-gradient-to-br from-primary to-primary-container text-on-primary px-8 py-3 rounded-md font-label text-sm font-semibold tracking-wide flex items-center gap-2 hover:opacity-90 transition-opacity">
<span class="material-symbols-outlined text-sm" data-icon="directions">directions</span>
                        GET DIRECTIONS
                    </button>
<button class="bg-surface-container-high text-on-surface px-8 py-3 rounded-md font-label text-sm font-semibold tracking-wide hover:bg-surface-container-highest transition-colors">
                        VIRTUAL TOUR
                    </button>
</div>
</div>
<!-- Hero Image: Overlapping Style -->
<div class="md:col-span-5 relative">
<div class="aspect-[4/5] rounded-xl overflow-hidden bg-surface-container shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
<img alt="Building Front" class="w-full h-full object-cover" data-alt="Sleek modernist university building with floor to ceiling glass windows and steel beams during the blue hour with glowing interior lights" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAradBNrctjyLWKpKMW7b8T087HR6WvysaOna4G6DoAMkGZ0juzV-kF7oR5e2INqhwE7ka9vNEzWjOu9ouF49Y5i6QvQFbJUpxiyLJ0x9zjn7fK3pgnCf5dWok33yjyPBZlAaQxuEX6iqHMqmovgt_hX3p4v-mRUTB2MsTu9IQ6CfcqnfCQ90H_j1T6DR9NsxDFlWbuYy--p-PZ-RK1XflN9soQcwbiJ93J4ofri-YqgLBjpKv8IY8HyyyIs3HiK3O4Nojd_7PeEm0"/>
</div>
<div class="absolute -bottom-6 -left-6 bg-secondary-container p-6 rounded-xl shadow-lg -rotate-3 hidden md:block">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-secondary" data-icon="schedule_send">schedule_send</span>
<div>
<p class="font-label text-[10px] uppercase font-black text-on-secondary-container">Status</p>
<p class="font-headline text-sm font-bold text-on-secondary-container">Open Until 10:00 PM</p>
</div>
</div>
</div>
</div>
</section>
<!-- Bento Grid: Building Info -->
<section class="grid grid-cols-1 md:grid-cols-3 gap-6">
<!-- Opening Hours Card -->
<div class="md:col-span-1 bg-surface-container-lowest p-8 rounded-xl shadow-[0_8px_24px_rgba(25,28,29,0.04)] border-l-4 border-secondary flex flex-col justify-between">
<div class="space-y-6">
<div class="flex items-center gap-3">
<span class="material-symbols-outlined text-primary" data-icon="schedule">schedule</span>
<h3 class="font-headline text-xl font-bold">Hours of Operation</h3>
</div>
<div class="space-y-3">
<div class="flex justify-between items-center border-b border-outline-variant/15 pb-2">
<span class="text-on-surface-variant font-medium">Mon - Fri</span>
<span class="text-primary font-bold">08:00 - 22:00</span>
</div>
<div class="flex justify-between items-center border-b border-outline-variant/15 pb-2">
<span class="text-on-surface-variant font-medium">Saturday</span>
<span class="text-primary font-bold">09:00 - 18:00</span>
</div>
<div class="flex justify-between items-center">
<span class="text-on-surface-variant font-medium">Sunday</span>
<span class="text-on-error font-bold bg-error px-2 py-0.5 rounded text-[10px] uppercase">Closed</span>
</div>
</div>
</div>
<p class="mt-8 font-label text-[10px] text-outline uppercase tracking-tighter">Quiet hours begin at 20:00 daily</p>
</div>
<!-- Departments Card: Digital Syllabus Style -->
<div class="md:col-span-2 bg-surface-container p-8 rounded-xl">
<div class="flex justify-between items-end mb-8">
<div class="space-y-1">
<span class="font-label text-[10px] uppercase tracking-[0.2em] text-secondary">Organization</span>
<h3 class="font-headline text-2xl font-bold">Departments &amp; Facilities</h3>
</div>
<span class="material-symbols-outlined text-primary/20 text-4xl" data-icon="account_balance">account_balance</span>
</div>
<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
<!-- Dept Item -->
<div class="group bg-surface-container-lowest p-4 rounded-xl flex items-start gap-4 hover:bg-primary hover:text-on-primary transition-all duration-300">
<div class="w-2 h-10 bg-secondary rounded-full group-hover:bg-secondary-container transition-colors"></div>
<div>
<h4 class="font-headline font-bold text-base">Digital Media Lab</h4>
<p class="text-xs text-on-surface-variant group-hover:text-primary-fixed-dim">Level 2, Wing A</p>
</div>
</div>
<!-- Dept Item -->
<div class="group bg-surface-container-lowest p-4 rounded-xl flex items-start gap-4 hover:bg-primary hover:text-on-primary transition-all duration-300">
<div class="w-2 h-10 bg-outline-variant rounded-full group-hover:bg-secondary-container transition-colors"></div>
<div>
<h4 class="font-headline font-bold text-base">History of Art</h4>
<p class="text-xs text-on-surface-variant group-hover:text-primary-fixed-dim">Level 4, South Hall</p>
</div>
</div>
<!-- Dept Item -->
<div class="group bg-surface-container-lowest p-4 rounded-xl flex items-start gap-4 hover:bg-primary hover:text-on-primary transition-all duration-300">
<div class="w-2 h-10 bg-outline-variant rounded-full group-hover:bg-secondary-container transition-colors"></div>
<div>
<h4 class="font-headline font-bold text-base">Robotics Studio</h4>
<p class="text-xs text-on-surface-variant group-hover:text-primary-fixed-dim">Basement Level</p>
</div>
</div>
<!-- Dept Item -->
<div class="group bg-surface-container-lowest p-4 rounded-xl flex items-start gap-4 hover:bg-primary hover:text-on-primary transition-all duration-300">
<div class="w-2 h-10 bg-outline-variant rounded-full group-hover:bg-secondary-container transition-colors"></div>
<div>
<h4 class="font-headline font-bold text-base">Student Commons</h4>
<p class="text-xs text-on-surface-variant group-hover:text-primary-fixed-dim">Ground Floor</p>
</div>
</div>
</div>
</div>
</section>
<!-- Secondary Information: Horizontal Carousel-like Cards -->
<section class="space-y-6">
<h3 class="font-headline text-xl font-bold px-1">Upcoming Events in this Building</h3>
<div class="flex overflow-x-auto gap-6 pb-6 no-scrollbar snap-x">
<!-- Event Card 1 -->
<div class="min-w-[280px] bg-primary-fixed p-6 rounded-xl snap-start border-l-4 border-primary">
<span class="font-label text-[10px] font-bold uppercase tracking-widest text-on-primary-fixed-variant">NOW HAPPENING</span>
<h4 class="font-headline text-lg font-bold text-on-primary-fixed mt-2">Modernism Symposium</h4>
<p class="text-sm text-on-primary-fixed-variant mt-1">Room 204 • 14:00 - 16:00</p>
</div>
<!-- Event Card 2 -->
<div class="min-w-[280px] bg-surface-container-high p-6 rounded-xl snap-start">
<span class="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">TOMORROW</span>
<h4 class="font-headline text-lg font-bold text-on-surface mt-2">Fabrication Workshop</h4>
<p class="text-sm text-on-surface-variant mt-1">Basement Lab • 10:00 - 13:00</p>
</div>
<!-- Event Card 3 -->
<div class="min-w-[280px] bg-surface-container-high p-6 rounded-xl snap-start">
<span class="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">WEDNESDAY</span>
<h4 class="font-headline text-lg font-bold text-on-surface mt-2">Grad Student Gallery</h4>
<p class="text-sm text-on-surface-variant mt-1">Lobby • 18:00 - 20:00</p>
</div>
</div>
</section>
</main>
<!-- BottomNavBar -->
<nav class="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-6 pb-8 pt-4 bg-[#f8f9fa]/80 dark:bg-[#000a1e]/80 backdrop-blur-xl">
<a class="flex flex-col items-center justify-center text-[#191c1d] dark:text-[#f8f9fa] opacity-60 hover:opacity-100 transition-opacity active:scale-90 duration-150" href="#">
<span class="material-symbols-outlined" data-icon="map">map</span>
<span class="font-inter text-[10px] font-medium uppercase tracking-widest mt-1">Map</span>
</a>
<a class="flex flex-col items-center justify-center text-[#191c1d] dark:text-[#f8f9fa] opacity-60 hover:opacity-100 transition-opacity active:scale-90 duration-150" href="#">
<span class="material-symbols-outlined" data-icon="notifications">notifications</span>
<span class="font-inter text-[10px] font-medium uppercase tracking-widest mt-1">Notices</span>
</a>
<a class="flex flex-col items-center justify-center bg-[#000a1e] dark:bg-[#fed65b] text-[#ffffff] dark:text-[#000a1e] rounded-full w-12 h-12 active:scale-90 duration-150" href="#">
<span class="material-symbols-outlined" data-icon="search">search</span>
</a>
</nav>
<!-- Map FAB Overlay (Suppressed on detail pages per rules, but showing "Directions" instead as part of detail view) -->
</body></html>
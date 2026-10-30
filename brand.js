/* =====================================================================
   PS Mart - BRAND DETAILS  (sirf PS Mart ke owner Prashant Kumar edit karein)
   ---------------------------------------------------------------------
   Is ek file se About page ki ye cheezein badalti hain:
   contact, social links, timeline, future goals.
   - Social link ABHI KHALI hai. Jab genuine page ban jaye, link yahan daaliye,
     page par apne aap dikhne lagega. Khali ho to kuch nahi dikhta.
   - Timeline mein sirf WAHI date likhiye jo sach mein hui ho.
   - Is file mein koi password / secret key kabhi mat daaliye (ye public hai).
   ===================================================================== */
window.PSMART_BRAND = {
  contact: {
    email: "prashant05010@gmail.com",
    phone: "+91 73074 53683",
    phoneLink: "+917307453683",
    location: "Lucknow, Uttar Pradesh, India"
  },

  /* Genuine aur confirmed hone par hi link daaliye, warna "" chhodiye */
  social: {
    instagram: "",
    facebook: "",
    youtube: "",
    x: "",
    linkedin: ""
  },

  /* Company timeline. status: "done" = ho chuka, "upcoming" = aane wala.
     show:false = abhi page par nahi dikhega (date confirm hone par true kar dein). */
  timeline: [
    {
      date: "5 August 2026",
      title: "PS Mart brand created",
      text: "PS Mart was created as a brand by Prashant Kumar with the idea of connecting customers and sellers in one marketplace.",
      status: "done",
      show: true
    },
    {
      date: "",
      title: "Website development started",
      text: "Development of the PS Mart website began.",
      status: "done",
      show: false            /* date confirm karke date bharein aur show:true karein */
    },
    {
      date: "Coming soon",
      title: "Official public launch",
      text: "The official public launch date will be announced here once it is confirmed.",
      status: "upcoming",
      show: true
    }
  ],

  /* Future goals - jo likhna ho yahan se badlein */
  goals: [
    "Welcome more local and online sellers to the PS Mart marketplace.",
    "Add more product categories for customers to choose from.",
    "Keep improving the shopping, checkout and order experience.",
    "Strengthen customer and seller support."
  ]
};

const c=n=>`rgb(var(--${n}) / <alpha-value>)`;
module.exports={darkMode:"class",content:["./app/**/*.{ts,tsx}","./components/**/*.{ts,tsx}"],
theme:{extend:{colors:{bg:c("bg"),surface:c("surface"),ink:c("ink"),muted:c("muted"),accent:c("accent"),gold:c("gold"),line:c("line")},
fontFamily:{display:["Bricolage Grotesque","Georgia","sans-serif"],sans:["Figtree","system-ui","sans-serif"]}}},plugins:[]};

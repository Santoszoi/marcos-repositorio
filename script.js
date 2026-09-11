const header=document.getElementById("header");
const menuBtn=document.getElementById("menuBtn");
const mobileNav=document.getElementById("mobileNav");

addEventListener("scroll",()=>header.classList.toggle("scrolled",scrollY>10));
menuBtn.addEventListener("click",()=>mobileNav.classList.toggle("open"));
mobileNav.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>mobileNav.classList.remove("open")));

const form=document.getElementById("contactForm");
form.addEventListener("submit",async e=>{
  e.preventDefault();
  const btn=form.querySelector(".submit-btn");
  const success=document.getElementById("success");
  const original=btn.textContent;
  btn.textContent="Enviando...";
  btn.disabled=true;
  success.classList.remove("show");
  try{
    const data=new FormData(form);
    const body=new URLSearchParams(data);
    const response=await fetch("/",{
      method:"POST",
      headers:{"Content-Type":"application/x-www-form-urlencoded"},
      body:body.toString()
    });
    if(!response.ok) throw new Error("Falha no envio");
    form.reset();
    success.textContent="Mensagem enviada com sucesso. Obrigado pelo contato!";
    success.classList.add("show");
  }catch(error){
    success.textContent="Não foi possível enviar agora. Tente novamente em alguns instantes.";
    success.classList.add("show");
  }finally{
    btn.textContent=original;
    btn.disabled=false;
  }
});

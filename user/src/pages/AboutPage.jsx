import { Link } from "react-router-dom";
import { useLang } from "../LangContext";
import { useTheme } from "../ThemeContext";
import PublicNavbar from "../components/PublicNavbar";
import CustomerServiceFooter from "../components/CustomerServiceFooter";



export default function AboutPage() {
  const { t, dir } = useLang();
  const { colors: c } = useTheme();

  return (
    <div className="about-page" style={{background: c.bg}}>
      <PublicNavbar active="about" />
      <header className="about-hero">
        <img src="image/stage.png" className="hero-image" alt="" />
        <div className="overlay"></div>
        <div className="hero-content">
          <span>{t("عن إيفرست", "ABOUT EVEREST")}</span>
          <h1>{t("حقق الأعلى.", "Reach Higher.")}<br />{t("مثل إيفرست.", "Like Everest.")}</h1>
          <p>{t("تعلم مهارات قيمة، ابنِ مجتمعات قوية، وافتح فرصاً جديدة للنمو.", "Learn valuable skills, build strong communities and unlock new opportunities for growth.")}</p>
        </div>
      </header>

      <section className="online-learning">
        <div className="online-content">
          <span>{t("كيف نعمل", "HOW WE OPERATE")}</span>
          <h2>{t("تعلم في أي مكان.", "Learn Anywhere.")}<br />{t("انمو في كل مكان.", "Grow Everywhere.")}</h2>
          <p>{t("نعمل من خلال نظام تعليمي رقمي بالكامل، مما يسمح للأعضاء بالوصول إلى التعليم والتوجيه والدعم من أي مكان.", "We operate through a fully digital learning system, allowing members to access education, mentorship and support from anywhere.")}</p>
          <p>{t("بينما يتم تقديم برامجنا عبر الإنترنت، ننظم بانتظام فعاليات وورش عمل شخصية يتم الإعلان عنها مسبقاً. توفر هذه اللقاءات فرصاً للتواصل مع الموجهين والخبراء والأعضاء الآخرين مع بناء علاقات قيمة.", "While our programs are delivered online, we regularly organize in-person events and workshops announced in advance. These gatherings provide opportunities to connect with mentors, experts and fellow members while building valuable relationships.")}</p>
        </div>
        <div className="online-image">
          <img src="image/online.png" alt={t("مجتمع إيفرست", "Everest Community")} />
        </div>
      </section>

      <section className="why-everest">
        <div className="why-left">
          <span className="section-tag">{t("لماذا إيفرست", "WHY EVEREST")}</span>
          <h2>{t("لماذا يختارنا الناس؟", "Why People Choose Us?")}</h2>
          <p>{t("تجمع Everest Academy بين التعليم العملي والتوجيه الخبير والمجتمع القوي لمساعدة الأفراد الطموحين على تعلم مهارات قيمة والنمو بشكل أسرع وفتح فرص جديدة.", "Everest Academy combines practical education, expert guidance and a strong community to help ambitious individuals learn valuable skills, grow faster and unlock new opportunities.")}</p>
         
        </div>
        <div className="why-right">
          <div className="feature-item">
            <div className="feature-number">01</div>
            <div><h3>{t("تعليم عملي", "Practical Education")}</h3><p>{t("تعلم مهارات واقعية من خلال دورات منظمة مصممة للتطبيق العملي.", "Learn real-world skills through structured courses designed for practical application.")}</p></div>
          </div>
          <div className="feature-item">
            <div className="feature-number">02</div>
            <div><h3>{t("مجتمع قوي", "Strong Community")}</h3><p>{t("تواصل مع الموجهين والأعضاء الذين يدعمون رحلتك التعليمية.", "Connect with mentors and members who support your learning journey.")}</p></div>
          </div>
          <div className="feature-item">
            <div className="feature-number">03</div>
            <div><h3>{t("فرص النمو", "Growth Opportunities")}</h3><p>{t("اكتشف فرصاً جديدة للتطوير الشخصي ونمو القيادة.", "Discover new opportunities for personal development and leadership growth.")}</p></div>
          </div>
          <div className="feature-item">
            <div className="feature-number">04</div>
            <div><h3>{t("الفعاليات والتواصل", "Events & Networking")}</h3><p>{t("انضم إلى ورش العمل والفعاليات التي تساعد في بناء علاقات قيمة.", "Join workshops and events that help build valuable connections.")}</p></div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-top"><p>{t("تحتاج مساعدة؟ تفضل بزيارة", "Need Help? Visit our")} <a href="#">{t("قسم المساعدة", "Help Section")}</a></p></div>
        <div className="footer-middle">
          <div className="brand"><h3>F</h3><span>{t("© 1999 - 2026 Everest Academy", "© 1999 - 2026 Everest Academy")}</span></div>
          <div className="social">
            <a href="#">f</a><a href="#">in</a><a href="#">▶</a><a href="#">✈</a><a href="#">𝕏</a><a href="#">◎</a>
          </div>
        </div>
        <div className="footer-bottom"><CustomerServiceFooter /></div>
      </footer>

      <section className="disclaimer">
        <div className="disclaimer-grid">
          <p><strong>{t("تداول بمسؤولية:", "Trade Responsibly:")}</strong> {t("تداول الأدوات المالية يحمل درجة عالية من المخاطرة...", "Trading financial instruments carry a high level...")}</p>
          <p>{t("Everest Academy هي علامة تجارية مسجلة تستخدم بموجب...", "Everest Academy is a registered trademark utilised under...")}</p>
          <p>{t("Everest Academy لا تقدم خدمات للمقيمين في...", "Everest Academy doesn't offer services to residents...")}</p>
        </div>
      </section>

    </div>
  );
} 
       
        
       
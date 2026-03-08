export default function FooterDark() {
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fw-green to-fw-cyan flex items-center justify-center text-fw-bg font-heading font-bold text-xs">
                FW
              </div>
              <span className="font-heading font-semibold text-sm tracking-wider">
                FREEDOM WORLD
              </span>
            </div>
            <p className="text-fw-text-tertiary text-xs leading-relaxed">
              แพลตฟอร์มสร้างชุมชนและระบบการตลาดแบบเกมมิฟิเคชั่น สำหรับธุรกิจยุคใหม่
            </p>
          </div>

          {/* Get Started */}
          <div>
            <h4 className="text-fw-text-primary text-sm font-semibold mb-4">เริ่มต้น</h4>
            <ul className="space-y-2 text-fw-text-tertiary text-xs">
              <li><a href="/onboarding" className="hover:text-fw-text-primary transition-colors">สร้างชุมชน</a></li>
              <li><a href="https://freedom.world" className="hover:text-fw-text-primary transition-colors">เข้าร่วมชุมชน</a></li>
              <li><a href="https://console.freedom.world" className="hover:text-fw-text-primary transition-colors">Freedom Console</a></li>
              <li><a href="https://info.freedom.world" className="hover:text-fw-text-primary transition-colors">นัดเดโม</a></li>
            </ul>
          </div>

          {/* Ecosystem */}
          <div>
            <h4 className="text-fw-text-primary text-sm font-semibold mb-4">Ecosystem</h4>
            <ul className="space-y-2 text-fw-text-tertiary text-xs">
              <li><a href="#" className="hover:text-fw-text-primary transition-colors">The Scape</a></li>
              <li><a href="#" className="hover:text-fw-text-primary transition-colors">Freedom Token (FDM)</a></li>
              <li><a href="#" className="hover:text-fw-text-primary transition-colors">Freedom Shards</a></li>
              <li><a href="#" className="hover:text-fw-text-primary transition-colors">Freedom Card</a></li>
              <li><a href="#" className="hover:text-fw-text-primary transition-colors">Freedom Planets</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-fw-text-primary text-sm font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-fw-text-tertiary text-xs">
              <li><a href="#" className="hover:text-fw-text-primary transition-colors">Freedom Blog</a></li>
              <li><a href="#" className="hover:text-fw-text-primary transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-fw-text-primary transition-colors">Merchant Policy</a></li>
              <li><a href="#" className="hover:text-fw-text-primary transition-colors">ติดต่อเรา</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-fw-text-tertiary text-xs">
            © {new Date().getFullYear()} Freedomverse Co., Ltd. All Rights Reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="https://apps.apple.com" className="text-fw-text-tertiary hover:text-fw-text-primary text-xs transition-colors">
              App Store
            </a>
            <a href="https://play.google.com" className="text-fw-text-tertiary hover:text-fw-text-primary text-xs transition-colors">
              Google Play
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

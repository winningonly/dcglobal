import Image from "next/image";
import { ArrowRight, GraduationCap, Award } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a29]">
      {/* Header */}
      <header className="w-full py-4 px-6 md:px-12">
        <div className="flex items-center gap-3">
          <Image
            src="https://ext.same-assets.com/891388946/1516515404.png"
            alt="DC Certificates Logo"
            width={44}
            height={44}
            className="w-11 h-11"
          />
          <span className="text-xl font-semibold text-[#3b82f6]">DC Certificates</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4 md:px-8 py-6 md:py-12">
        {/* Hero Section */}
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center text-center">
          {/* Hero Image with Gradient */}
          <div className="relative w-full max-w-3xl mb-10 md:mb-14">
            {/* Hero Image - using the original image which already has the gradient and text */}
            <Image
              src="https://ext.same-assets.com/891388946/371235521.png"
              alt="Dominion City Certificate Issuing Portal"
              width={768}
              height={492}
              className="w-full h-auto rounded-3xl"
              priority
            />
          </div>

          {/* Main Heading */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 tracking-tight">
            Empower Your Growth with a Dominion<br className="hidden md:block" /> City Certification
          </h1>

          {/* Subheading */}
          <p className="text-gray-400 text-base md:text-lg mb-12 max-w-2xl">
            Verify Your Achievements. Issue & Receive Digital Certificates with Ease.
          </p>

          {/* CTA Button */}
          <a
            href="#"
            className="cta-button inline-flex items-center gap-3 bg-white text-[#0a0a29] font-semibold px-10 py-4 rounded-full hover:bg-gray-100 text-base"
          >
            Get Certificate
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>

        {/* Info Cards Section */}
        <div className="w-full max-w-6xl mx-auto mt-16 md:mt-24 hidden lg:grid grid-cols-3 gap-6 px-4">
          {/* Card 1 - Connect with DC Church */}
          <div className="info-card rounded-2xl p-8 text-center cursor-pointer">
            <div className="w-14 h-14 mx-auto mb-5">
              <Image
                src="https://ext.same-assets.com/891388946/3764894079.svg"
                alt="Church icon"
                width={56}
                height={56}
                className="w-full h-full"
              />
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Connect with a DC Church
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Find a Dominion City Church location near you and reach out to them to express your interest in obtaining the Various courses&apos; certificate.
            </p>
          </div>

          {/* Card 2 - Undergo the Training */}
          <div className="info-card rounded-2xl p-8 text-center cursor-pointer">
            <div className="w-14 h-14 mx-auto mb-5 flex items-center justify-center">
              <GraduationCap className="w-12 h-12 text-[#3b82f6]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Undergo the Training
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Participate in the program offered by Dominion City. The program will provide the necessary knowledge and skills to fulfill the requirements for certification.
            </p>
          </div>

          {/* Card 3 - Get Certified */}
          <div className="info-card rounded-2xl p-8 text-center cursor-pointer">
            <div className="w-14 h-14 mx-auto mb-5 flex items-center justify-center">
              <Award className="w-12 h-12 text-[#3b82f6]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Get Certified
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Upon successful completion of the training and exams, you will be awarded a certificate from Dominion City Church, recognizing your achievement and qualification.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 mt-auto border-t border-gray-800/50">
        <div className="text-center text-gray-500 text-sm">
          <p>Copyright © 2025 DC Global Certificate Issuer</p>
        </div>
      </footer>
    </div>
  );
}

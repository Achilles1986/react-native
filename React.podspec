require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name                = "React"
  s.version             = package['version']
  s.summary             = package['description']
  s.description         = <<-DESC
                            React Native apps are built using the React JS
                            framework, and render directly to native UIKit
                            elements using a fully asynchronous architecture.
                            There is no browser and no HTML. We have picked what
                            we think is the best set of features from these and
                            other technologies to build what we hope to become
                            the best product development framework available,
                            with an emphasis on iteration speed, developer
                            delight, continuity of technology, and absolutely
                            beautiful and fast products with no compromises in
                            quality or capability.
                         DESC
  s.homepage            = "http://facebook.github.io/react-native/"
  s.license             = package['license']
  s.author              = "Facebook"
  s.source              = { :git => "https://github.com/facebook/react-native.git", :tag => "v#{s.version}" }
  s.default_subspec     = 'Core'
  s.requires_arc        = true
  s.platform            = :ios, "8.0"
  s.pod_target_xcconfig = { "CLANG_CXX_LANGUAGE_STANDARD" => "c++14" }
  s.header_dir          = 'React'
  s.preserve_paths      = "package.json", "LICENSE", "LICENSE-CustomComponents", "PATENTS"

  s.subspec 'Core' do |ss|
    ss.dependency      'React/yoga'
    ss.dependency      'React/cxxreact'
    ss.source_files  = "React/**/*.{c,h,m,mm,S}"
    ss.exclude_files = "**/__tests__/*", "IntegrationTests/*", "React/**/RCTTVView.*", "ReactCommon/yoga/*"
    ss.frameworks    = "JavaScriptCore"
    ss.libraries     = "stdc++"
  end

  s.subspec 'tvOS' do |ss|
    ss.dependency       'React/Core'
    ss.source_files   = "React/**/RCTTVView.{h, m}"
  end

  s.subspec 'jschelpers' do |ss|
    ss.source_files = 'ReactCommon/jschelpers/{JavaScriptCore,JSCWrapper}.{cpp,h}'
    ss.header_dir   = 'jschelpers'
  end

  s.subspec 'cxxreact' do |ss|
    ss.dependency     'React/jschelpers'
    ss.source_files = 'ReactCommon/cxxreact/{JSBundleType,oss-compat-util}.{cpp,h}'
    ss.header_dir   = 'cxxreact'
  end

  s.subspec 'yoga' do |ss|
    ss.source_files = 'ReactCommon/yoga/**/*.{c,h}'
    ss.header_dir   = 'yoga'
  end

  s.subspec 'ART' do |ss|
    ss.dependency       'React/Core'
    ss.source_files   = "Libraries/ART/**/*.{h,m}"
  end

  s.subspec 'RCTActionSheet' do |ss|
    ss.dependency       'React/Core'
    ss.source_files   = "Libraries/ActionSheetIOS/*.{h,m}"
  end

  s.subspec 'RCTAdSupport' do |ss|
    ss.dependency       'React/Core'
    ss.source_files   = "Libraries/AdSupport/*.{h,m}"
  end

  s.subspec 'RCTAnimation' do |ss|
    ss.dependency       'React/Core'
    ss.source_files   = "Libraries/NativeAnimation/{Drivers/*,Nodes/*,*}.{h,m}"
  end

  s.subspec 'RCTCameraRoll' do |ss|
    ss.dependency       'React/Core'
    ss.dependency       'React/RCTImage'
    ss.source_files   = "Libraries/CameraRoll/*.{h,m}"
  end

  s.subspec 'RCTGeolocation' do |ss|
    ss.dependency       'React/Core'
    ss.source_files   = "Libraries/Geolocation/*.{h,m}"
  end

  s.subspec 'RCTImage' do |ss|
    ss.dependency       'React/Core'
    ss.dependency       'React/RCTNetwork'
    ss.source_files   = "Libraries/Image/*.{h,m}"
  end

  s.subspec 'RCTNetwork' do |ss|
    ss.dependency       'React/Core'
    ss.source_files   = "Libraries/Network/*.{h,m,mm}"
  end

  s.subspec 'RCTPushNotification' do |ss|
    ss.dependency       'React/Core'
    ss.source_files   = "Libraries/PushNotificationIOS/*.{h,m}"
  end

  s.subspec 'RCTSettings' do |ss|
    ss.dependency       'React/Core'
    ss.source_files   = "Libraries/Settings/*.{h,m}"
  end

  s.subspec 'RCTText' do |ss|
    ss.dependency       'React/Core'
    ss.source_files   = "Libraries/Text/*.{h,m}"
  end

  s.subspec 'RCTVibration' do |ss|
    ss.dependency       'React/Core'
    ss.source_files   = "Libraries/Vibration/*.{h,m}"
  end

  s.subspec 'RCTWebSocket' do |ss|
    ss.dependency       'React/Core'
    ss.source_files   = "Libraries/WebSocket/*.{h,m}"
  end

  s.subspec 'RCTLinkingIOS' do |ss|
    ss.dependency       'React/Core'
    ss.source_files   = "Libraries/LinkingIOS/*.{h,m}"
  end

  s.subspec 'RCTTest' do |ss|
    ss.dependency       'React/Core'
    ss.source_files   = "Libraries/RCTTest/**/*.{h,m}"
    ss.frameworks     = "XCTest"
  end
end

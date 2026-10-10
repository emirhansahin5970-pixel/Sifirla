//
//  SifirlaViewController.swift
//  Sıfırla
//
//  Capacitor, npm paketi olarak gelen eklentileri kendiliğinden bulur; ama
//  UYGULAMA HEDEFİ içinde yazılan eklentileri bulmaz — onlar bu kancada elle
//  kaydedilir. Storyboard'daki kök denetleyicinin sınıfı da buna çevrilmiştir.
//

import UIKit
import Capacitor

class SifirlaViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginType(SifirlaZekaPlugin.self)
        // Uygulama hissi: sayfa yalnızca dikey kayar. Çapraz parmak hareketinde
        // içerik sağa sola "sallanmaz"; yatay sekme/esneme kapalı.
        if let kaydirma = webView?.scrollView {
            kaydirma.isDirectionalLockEnabled = true
            kaydirma.alwaysBounceHorizontal = false
            kaydirma.showsHorizontalScrollIndicator = false
            kaydirma.pinchGestureRecognizer?.isEnabled = false
        }
    }
}

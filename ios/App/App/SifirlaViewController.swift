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
    }
}

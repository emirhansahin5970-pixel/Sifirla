//
//  SifirlaViewController.swift
//  Sıfırla
//
//  Capacitor, npm paketi olarak gelen eklentileri kendiliğinden bulur; ama
//  UYGULAMA HEDEFİ içinde yazılan eklentileri bulmaz — onlar bu kancada elle
//  kaydedilir. Storyboard'daki kök denetleyicinin sınıfı da buna çevrilmiştir.
//
//  NEDEN registerPluginInstance (registerPluginType DEĞİL):
//  Capacitor 8'de CapacitorBridge.registerPluginType, autoRegisterPlugins
//  true iken (varsayılan) HİÇBİR ŞEY YAPMADAN döner. Eski kod bu yüzden
//  sessizce boşa gidiyordu: eklenti ne bridge.plugins'e girdi ne de JS'e
//  Capacitor.Plugins.SifirlaZeka olarak aktarıldı. registerPluginInstance bu
//  korumaya takılmaz; eklentiyi kaydeder, load() çağırır ve JS vekilini
//  (Capacitor.Plugins.SifirlaZeka + PluginHeaders) belge başında enjekte eder.
//  capacitorDidLoad, loadWebView'dan ÖNCE çalıştığı için betik ilk sayfa
//  yüklemesine yetişir.
//

import UIKit
import Capacitor

class SifirlaViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(SifirlaZekaPlugin())
    }
}

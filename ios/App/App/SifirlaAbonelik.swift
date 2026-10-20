//
//  SifirlaAbonelik.swift
//  Sıfırla — Apple abonelik köprüsü (StoreKit 2, iOS 15+)
//
//  İLKELER
//  · Ödemeyi Apple alır; uygulama kart bilgisi görmez, sunucumuz yoktur.
//  · Abonelik durumu Apple'ın İMZALI işlemlerinden okunur (yalnızca
//    `.verified` sonuçlar sayılır). Çevrimdışıyken StoreKit son bilinen
//    yetkileri cihazdan döndürür.
//  · Dış SDK / analitik yok: "Veri Toplanmıyor" etiketi korunur.
//  · Deneme başlangıcı Anahtarlık'ta (Keychain) tutulur: uygulamayı silip
//    yeniden kurmak 30 günlük denemeyi baştan başlatmaz. Yalnızca bir tarih
//    saklanır; cihazdan çıkmaz.
//
//  JS tarafı: window.Capacitor.nativePromise("SifirlaAbonelik", metot, veri)
//  (ABONELIK modülü, uygulama/index.html). Kayıt: SifirlaViewController.
//

import Foundation
import UIKit
import Capacitor
import StoreKit
import Security

@objc(SifirlaAbonelikPlugin)
public class SifirlaAbonelikPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "SifirlaAbonelikPlugin"
    public let jsName = "SifirlaAbonelik"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "urunler", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "durum", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "satinAl", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "geriYukle", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "yonet", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "denemeBaslangic", returnType: CAPPluginReturnPromise)
    ]

    /// App Store Connect'te açılacak ürün kimliği (aylık otomatik yenilenen abonelik)
    static let urunKimlikleri: [String] = ["app.sifirla.pro.aylik"]

    private var dinleyici: Task<Void, Never>?

    override public func load() {
        NSLog("[SifirlaAbonelik] eklenti yuklendi")
        // Uygulama dışında gerçekleşen işlemler (yenileme, aile onayı, iade,
        // başka cihazdan satın alma) burada yakalanıp kapatılır. JS tarafı
        // durumu açılışta ve uygulamaya her dönüşte yeniden okur.
        dinleyici = Task.detached {
            for await sonuc in Transaction.updates {
                if case .verified(let islem) = sonuc { await islem.finish() }
            }
        }
    }

    deinit { dinleyici?.cancel() }

    // MARK: Yetki özeti

    private static func yetkiOzeti() async -> [String: Any] {
        var aktif = false
        var urun = ""
        var bitisMs: Double = 0
        var yenilenecek = true
        for await sonuc in Transaction.currentEntitlements {
            guard case .verified(let islem) = sonuc else { continue }
            guard urunKimlikleri.contains(islem.productID), islem.revocationDate == nil else { continue }
            if let bitis = islem.expirationDate, bitis < Date() { continue }
            aktif = true
            urun = islem.productID
            if let bitis = islem.expirationDate { bitisMs = max(bitisMs, bitis.timeIntervalSince1970 * 1000) }
        }
        if aktif, let u = try? await Product.products(for: [urun]).first,
           let durumlar = try? await u.subscription?.status {
            for d in durumlar {
                if case .verified(let bilgi) = d.renewalInfo { yenilenecek = bilgi.willAutoRenew }
            }
        }
        return ["aktif": aktif, "urun": urun, "bitisMs": bitisMs, "yenilenecek": yenilenecek]
    }

    // MARK: Metotlar

    @objc func urunler(_ call: CAPPluginCall) {
        Task {
            do {
                let liste = try await Product.products(for: Self.urunKimlikleri)
                let cikti: [[String: Any]] = liste.map { u in
                    var d: [String: Any] = ["id": u.id, "fiyat": u.displayPrice, "ad": u.displayName]
                    if let a = u.subscription {
                        d["birim"] = Self.birimAdi(a.subscriptionPeriod.unit)
                        d["deger"] = a.subscriptionPeriod.value
                    }
                    return d
                }
                call.resolve(["urunler": cikti])
            } catch {
                call.resolve(["urunler": [] as [Any], "hata": error.localizedDescription])
            }
        }
    }

    @objc func durum(_ call: CAPPluginCall) {
        Task {
            let ozet = await Self.yetkiOzeti()
            call.resolve(ozet)
        }
    }

    @objc func satinAl(_ call: CAPPluginCall) {
        let kimlik = call.getString("id") ?? Self.urunKimlikleri[0]
        Task {
            do {
                guard let urun = try await Product.products(for: [kimlik]).first else {
                    call.resolve(["sonuc": "urunYok"]); return
                }
                let sonuc = try await urun.purchase()
                switch sonuc {
                case .success(let dogrulama):
                    guard case .verified(let islem) = dogrulama else {
                        call.resolve(["sonuc": "dogrulanamadi"]); return
                    }
                    await islem.finish()
                    var ozet = await Self.yetkiOzeti()
                    ozet["sonuc"] = "tamam"
                    call.resolve(ozet)
                case .pending:
                    call.resolve(["sonuc": "bekliyor"])      // ör. Aile onayı bekleniyor
                case .userCancelled:
                    call.resolve(["sonuc": "vazgecti"])
                @unknown default:
                    call.resolve(["sonuc": "bilinmiyor"])
                }
            } catch {
                call.resolve(["sonuc": "hata", "mesaj": error.localizedDescription])
            }
        }
    }

    /// "Satın alımları geri yükle": Apple Kimliği ile senkronlar (gerekirse parola ister)
    @objc func geriYukle(_ call: CAPPluginCall) {
        Task {
            do { try await AppStore.sync() } catch {
                var ozet = await Self.yetkiOzeti()
                ozet["hata"] = error.localizedDescription
                call.resolve(ozet); return
            }
            call.resolve(await Self.yetkiOzeti())
        }
    }

    /// Apple'ın kendi "aboneliği yönet / iptal et" sayfası
    @objc func yonet(_ call: CAPPluginCall) {
        Task { @MainActor in
            if let sahne = self.bridge?.viewController?.view.window?.windowScene {
                do { try await AppStore.showManageSubscriptions(in: sahne); call.resolve(); return } catch { }
            }
            if let adres = URL(string: "https://apps.apple.com/account/subscriptions") {
                _ = await UIApplication.shared.open(adres)
            }
            call.resolve()
        }
    }

    /// Deneme başlangıcı: Anahtarlık'taki kayıt ile JS'in bildiği tarihten ERKEN
    /// olanı kalıcılaştırıp döndürür (milisaniye, Unix zamanı).
    @objc func denemeBaslangic(_ call: CAPPluginCall) {
        let simdi = Date().timeIntervalSince1970 * 1000
        var aday = call.getDouble("ms") ?? simdi
        if !(aday > 0) || aday > simdi { aday = simdi }
        if let kayitli = Self.anahtarlikOku(), kayitli > 0, kayitli <= aday {
            call.resolve(["ms": kayitli]); return
        }
        Self.anahtarlikYaz(aday)
        call.resolve(["ms": aday])
    }

    // MARK: Yardımcılar

    private static func birimAdi(_ b: Product.SubscriptionPeriod.Unit) -> String {
        switch b {
        case .day: return "gun"
        case .week: return "hafta"
        case .month: return "ay"
        case .year: return "yil"
        @unknown default: return "ay"
        }
    }

    private static let kcServis = "app.sifirla.deneme"
    private static let kcHesap = "baslangic"

    private static func kcSorgu() -> [String: Any] {
        [kSecClass as String: kSecClassGenericPassword,
         kSecAttrService as String: kcServis,
         kSecAttrAccount as String: kcHesap]
    }

    private static func anahtarlikOku() -> Double? {
        var q = kcSorgu()
        q[kSecReturnData as String] = true
        q[kSecMatchLimit as String] = kSecMatchLimitOne
        var sonuc: AnyObject?
        guard SecItemCopyMatching(q as CFDictionary, &sonuc) == errSecSuccess,
              let veri = sonuc as? Data,
              let metin = String(data: veri, encoding: .utf8),
              let deger = Double(metin) else { return nil }
        return deger
    }

    private static func anahtarlikYaz(_ ms: Double) {
        guard let veri = String(format: "%.0f", ms).data(using: .utf8) else { return }
        SecItemDelete(kcSorgu() as CFDictionary)
        var q = kcSorgu()
        q[kSecValueData as String] = veri
        q[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        SecItemAdd(q as CFDictionary, nil)
    }
}

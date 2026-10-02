//
//  SifirlaZeka.swift
//  Sıfırla — cihaz içi yapay zeka köprüsü (Apple FoundationModels, iOS 26+)
//
//  İLKELER
//  · Tamamen CİHAZ İÇİ. Hiçbir ağ çağrısı yok, hiçbir veri cihazdan çıkmaz.
//  · HESAPLAMA YAPILMAZ. Model yalnızca (a) kullanıcının yazdığı cümleden alan
//    çıkarır, (b) motorun hesapladığı sayıları Türkçe cümleye döker.
//    Tüm finansal hesap ENGINE'de kalır.
//  · Model yeni rakam üretemez: her sayısal çıktı, girdide geçen sayılarla
//    karşılaştırılıp doğrulanır. Doğrulanamayan alan BOŞ döner.
//  · Uygun olmayan cihazda (iPhone 15 Pro öncesi, Apple Intelligence kapalı,
//    model hazır değil, dil desteklenmiyor) özellik sessizce kapalıdır.
//

import Foundation
import Capacitor

#if canImport(FoundationModels)
import FoundationModels
#endif

// MARK: - Guided generation şeması

#if canImport(FoundationModels)

@available(iOS 26.0, *)
@Generable
enum ZekaBorcTuru: String {
    case krediKarti
    case taksitli
}

@available(iOS 26.0, *)
@Generable
enum ZekaFaizBirimi: String {
    case aylik
    case yillik
}

@available(iOS 26.0, *)
@Generable(description: "Borç cümlesinden çıkarılan alanlar")
struct ZekaBorcTaslak {
    @Guide(description: "Borcun kısa adı") var ad: String?
    @Guide(description: "krediKarti: kredi kartı/KMH. taksitli: taksitli kredi/alışveriş") var tur: ZekaBorcTuru?
    @Guide(description: "Kalan toplam bakiye") var bakiye: Double?
    @Guide(description: "Faiz oranı sayısı") var faiz: Double?
    @Guide(description: "Faiz birimi") var faizBirimi: ZekaFaizBirimi?
    @Guide(description: "Aylık asgari ödeme veya taksit tutarı") var odeme: Double?
    @Guide(description: "Ayın kaçı son ödeme günü") var sonOdemeGunu: Int?
    @Guide(description: "Toplam taksit sayısı") var taksitToplam: Int?
}

#endif

// MARK: - Sayı normalleştirme ve doğrulama (modelden BAĞIMSIZ, deterministik)

enum ZekaSayi {

    /// Türkçe sayı biçimlerini modele göndermeden önce sade tamsayıya çevirir.
    /// "37.500 TL" → "37500 TL", "18 bin" → "18000", "2,5 milyon" → "2500000".
    /// Modelin nokta/virgül belirsizliğini tamamen ortadan kaldırır.
    /// Dönüş: (normalize metin, metinde GEÇEN sayılar kümesi).
    static func normalize(_ metin: String) -> (metin: String, izinli: Set<Double>) {
        var izinli = Set<Double>()
        let desen = #"(\d{1,3}(?:\.\d{3})+|\d+(?:,\d+)?)(\s*)(bin|milyon)?"#
        guard let re = try? NSRegularExpression(pattern: desen, options: [.caseInsensitive]) else {
            return (metin, izinli)
        }
        let ns = metin as NSString
        var cikti = ""
        var son = 0
        for m in re.matches(in: metin, range: NSRange(location: 0, length: ns.length)) {
            cikti += ns.substring(with: NSRange(location: son, length: m.range.location - son))
            var ham = ns.substring(with: m.range(at: 1))
            let carpan = m.range(at: 3).location == NSNotFound
                ? "" : ns.substring(with: m.range(at: 3)).lowercased()
            if ham.contains("."), !ham.contains(",") {
                ham = ham.replacingOccurrences(of: ".", with: "")
            }
            ham = ham.replacingOccurrences(of: ",", with: ".")
            guard var d = Double(ham) else {
                cikti += ns.substring(with: m.range)
                son = m.range.location + m.range.length
                continue
            }
            if carpan == "bin" { d *= 1000 } else if carpan == "milyon" { d *= 1_000_000 }
            izinli.insert(d)
            cikti += (d == d.rounded()) ? String(Int(d)) : String(d)
            // Çarpan yoksa aradaki boşluk korunmalı ("9300 lira", "9300lira" değil)
            if carpan.isEmpty, m.range(at: 2).location != NSNotFound {
                cikti += ns.substring(with: m.range(at: 2))
            }
            son = m.range.location + m.range.length
        }
        cikti += ns.substring(from: son)
        return (cikti, izinli)
    }

    /// Model yeni rakam üretemez: değer yalnızca girdide geçiyorsa kabul edilir.
    static func dogrula(_ deger: Double?, _ izinli: Set<Double>) -> Double? {
        guard let d = deger, d > 0, d.isFinite else { return nil }
        return izinli.contains(where: { abs($0 - d) < 0.005 }) ? d : nil
    }

    /// Türkçe ekleri tolere eden gövde eşleşmesi ("Telefonu" ~ "Telefon").
    /// Modelin kılavuz metnini ada sızdırmasını da engeller.
    static func adDogrula(_ ad: String?, kaynak: String) -> String? {
        guard let a = ad?.trimmingCharacters(in: .whitespacesAndNewlines),
              a.count >= 2, a.count <= 60 else { return nil }
        let govde: (String) -> [String] = { s in
            s.lowercased().split { !$0.isLetter }.map(String.init)
                .filter { $0.count >= 3 }.map { String($0.prefix(4)) }
        }
        let kaynakGovde = Set(govde(kaynak))
        return govde(a).contains(where: { kaynakGovde.contains($0) }) ? a : nil
    }

    /// Metinde geçen tüm sayıları (anlatım doğrulaması için) toplar.
    static func metindekiSayilar(_ metin: String) -> Set<Double> {
        normalize(metin).izinli
    }
}

// MARK: - Capacitor eklentisi

@objc(SifirlaZekaPlugin)
public class SifirlaZekaPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "SifirlaZekaPlugin"
    public let jsName = "SifirlaZeka"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "kopruTesti", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "durum", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "borcAyristir", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "raporAnlat", returnType: CAPPluginReturnPromise)
    ]

    /// Model çağrıları için üst sınır. Aşılırsa çağıran tarafa zarifçe düşülür.
    private let zamanAsimiSaniye: UInt64 = 20

    /// Eklenti yüklendi mi / kullanılabilirlik ne döndü — native günlüğe yazar.
    /// (JS console'u Capacitor native loga köprülemiyor; teşhis için gerekli.)
    override public func load() {
        NSLog("[SifirlaZeka] eklenti yuklendi")
    }

    // MARK: Köprü teşhisi

    /// Modelden BAĞIMSIZ yankı çağrısı: JS ↔ native köprüsünün çalıştığını
    /// her cihazda (simülatör, eski iOS, Apple Intelligence kapalı) kanıtlar.
    /// Hiçbir veri işlemez; yalnızca gelen "yanki" dizesini geri döndürür.
    @objc func kopruTesti(_ call: CAPPluginCall) {
        #if canImport(FoundationModels)
        let frameworkVar = true
        #else
        let frameworkVar = false
        #endif
        let yanki = String((call.getString("yanki") ?? "").prefix(64))
        NSLog("[SifirlaZeka] kopruTesti yanki=\(yanki)")
        call.resolve([
            "tamam": true,
            "eklenti": jsName,
            "yanki": yanki,
            "ios": ProcessInfo.processInfo.operatingSystemVersionString,
            "frameworkVar": frameworkVar
        ])
    }

    // MARK: Kullanılabilirlik

    @objc func durum(_ call: CAPPluginCall) {
        #if canImport(FoundationModels)
        guard #available(iOS 26.0, *) else {
            call.resolve(["kullanilabilir": false, "sebep": "iosEski"])
            return
        }
        let model = SystemLanguageModel.default
        switch model.availability {
        case .available:
            // Dil kontrolü: uygulamanın dili modelce destekleniyor mu?
            let istenen = call.getString("dil") ?? "tr"
            let yerel = Locale(identifier: istenen == "en" ? "en_US" : "tr_TR")
            let dilVar = model.supportsLocale(yerel)
            NSLog("[SifirlaZeka] durum=available dilVar=\(dilVar)")
            call.resolve([
                "kullanilabilir": dilVar,
                "sebep": dilVar ? "hazir" : "dilDesteklenmiyor",
                "diller": model.supportedLanguages.map { $0.maximalIdentifier }.sorted()
            ])
        case .unavailable(let sebep):
            let kod: String
            switch sebep {
            case .deviceNotEligible: kod = "cihazUygunDegil"
            case .appleIntelligenceNotEnabled: kod = "appleIntelligenceKapali"
            case .modelNotReady: kod = "modelHazirDegil"
            @unknown default: kod = "bilinmeyen"
            }
            NSLog("[SifirlaZeka] durum=unavailable sebep=\(kod)")
            call.resolve(["kullanilabilir": false, "sebep": kod])
        @unknown default:
            call.resolve(["kullanilabilir": false, "sebep": "bilinmeyen"])
        }
        #else
        call.resolve(["kullanilabilir": false, "sebep": "frameworkYok"])
        #endif
    }

    // MARK: Özellik A — doğal dille borç ekleme

    @objc func borcAyristir(_ call: CAPPluginCall) {
        #if canImport(FoundationModels)
        guard #available(iOS 26.0, *) else { call.reject("iosEski"); return }
        let metin = (call.getString("metin") ?? "").trimmingCharacters(in: .whitespacesAndNewlines)
        guard metin.count >= 3, metin.count <= 400 else { call.reject("gecersizMetin"); return }

        let model = SystemLanguageModel.default
        guard case .available = model.availability else { call.reject("modelYok"); return }

        let (normalize, izinli) = ZekaSayi.normalize(metin)
        let kucuk = metin.lowercased()

        Task {
            do {
                let taslak = try await withZamanAsimi(saniye: zamanAsimiSaniye) {
                    let oturum = LanguageModelSession(model: model, instructions: Self.ayristirmaTalimati)
                    return try await oturum.respond(to: normalize, generating: ZekaBorcTaslak.self).content
                }

                // ---- DOĞRULAMA: modelin ürettiği her sayı girdide geçmeli ----
                var tur = taslak.tur?.rawValue
                // Güçlü anahtar kelimeler modeli ezer (KMH kredi kartı grubudur)
                if kucuk.contains("kmh") || kucuk.contains("kredi kartı") || kucuk.contains("kart") {
                    tur = "krediKarti"
                } else if kucuk.contains("taksit") {
                    tur = "taksitli"
                }

                let bakiye = ZekaSayi.dogrula(taslak.bakiye, izinli)
                let faiz = ZekaSayi.dogrula(taslak.faiz, izinli)
                var odeme = ZekaSayi.dogrula(taslak.odeme, izinli)
                // Aynı sayı hem bakiye hem ödeme olamaz — ödeme düşer
                if let o = odeme, let b = bakiye, abs(o - b) < 0.005 { odeme = nil }

                // Son ödeme günü yalnızca cümlede gün ipucu varsa kabul edilir
                let gunIpucu = kucuk.contains("ayın") || kucuk.contains("son ödeme")
                var gun: Int?
                if gunIpucu, let g = ZekaSayi.dogrula(taslak.sonOdemeGunu.map(Double.init), izinli) {
                    let gi = Int(g)
                    gun = (1...31).contains(gi) ? gi : nil
                }
                // Taksit sayısı yalnızca taksitli borçta
                var taksit: Int?
                if tur == "taksitli", let t = ZekaSayi.dogrula(taslak.taksitToplam.map(Double.init), izinli) {
                    let ti = Int(t)
                    taksit = (1...480).contains(ti) ? ti : nil
                }
                // Faiz birimi yalnızca faiz varsa anlamlı; metindeki ifade önceliklidir
                var birim: String?
                if faiz != nil {
                    if kucuk.contains("aylık") { birim = "aylik" }
                    else if kucuk.contains("yıllık") { birim = "yillik" }
                    else { birim = taslak.faizBirimi?.rawValue }
                }

                var sonuc: [String: Any] = ["tamam": true]
                if let v = ZekaSayi.adDogrula(taslak.ad, kaynak: metin) { sonuc["ad"] = v }
                if let v = tur { sonuc["tur"] = v }
                if let v = bakiye { sonuc["bakiye"] = v }
                if let v = faiz { sonuc["faiz"] = v }
                if let v = birim { sonuc["faizBirimi"] = v }
                if let v = odeme { sonuc["odeme"] = v }
                if let v = gun { sonuc["sonOdemeGunu"] = v }
                if let v = taksit { sonuc["taksitToplam"] = v }
                call.resolve(sonuc)
            } catch is ZamanAsimiHatasi {
                call.reject("zamanAsimi")
            } catch {
                call.reject("modelHatasi", nil, error)
            }
        }
        #else
        call.reject("frameworkYok")
        #endif
    }

    // MARK: Özellik B — aylık raporu insan diliyle anlatma

    @objc func raporAnlat(_ call: CAPPluginCall) {
        #if canImport(FoundationModels)
        guard #available(iOS 26.0, *) else { call.reject("iosEski"); return }
        // Motorun hesapladığı sayılar, HAZIR METİN olarak gelir.
        // Burada hiçbir hesap yapılmaz; model yalnızca anlatır.
        guard let olgular = call.getString("olgular"), !olgular.isEmpty else {
            call.reject("olguYok"); return
        }
        let model = SystemLanguageModel.default
        guard case .available = model.availability else { call.reject("modelYok"); return }

        // Girdide geçen sayılar: çıktıda bunların dışında rakam olamaz.
        let izinli = ZekaSayi.metindekiSayilar(olgular)

        Task {
            do {
                let metin = try await withZamanAsimi(saniye: zamanAsimiSaniye) {
                    let oturum = LanguageModelSession(model: model, instructions: Self.anlatimTalimati)
                    return try await oturum.respond(to: olgular).content
                }
                let temiz = metin.trimmingCharacters(in: .whitespacesAndNewlines)
                // ---- DOĞRULAMA: çıktıdaki her sayı girdide geçmeli ----
                let ciktiSayilari = ZekaSayi.metindekiSayilar(temiz)
                let uydurma = ciktiSayilari.filter { c in
                    !izinli.contains(where: { abs($0 - c) < 0.005 })
                }
                if !uydurma.isEmpty || temiz.isEmpty || temiz.count > 600 {
                    // Şablona düşülsün: JS tarafı kural tabanlı metni gösterir
                    call.resolve(["tamam": false, "sebep": "uydurmaRakam"])
                    return
                }
                call.resolve(["tamam": true, "metin": temiz])
            } catch is ZamanAsimiHatasi {
                call.resolve(["tamam": false, "sebep": "zamanAsimi"])
            } catch {
                call.resolve(["tamam": false, "sebep": "modelHatasi"])
            }
        }
        #else
        call.reject("frameworkYok")
        #endif
    }

    // MARK: Talimatlar

    private static let ayristirmaTalimati = """
    Türkçe borç cümlelerinden alan çıkarırsın.
    Sadece cümlede yazan bilgiyi kullan. Hesap yapma, tahmin etme, ortalama uydurma.
    Cümlede olmayan bir alan için değer üretme.
    Aynı sayıyı iki farklı alana yazma.
    """

    private static let anlatimTalimati = """
    Sana bir kullanıcının aylık borç özetine ait HAZIR SAYILAR verilir.
    Görevin yalnızca bu sayıları 2-3 kısa cümleyle Türkçe anlatmak.

    Kurallar:
    - ASLA yeni rakam üretme. Sadece sana verilen sayıları kullan.
    - Hesap yapma, toplama çıkarma yapma, yüzde hesaplama.
    - Sıcak, yargısız ve cesaret verici ol. Suçlayıcı dil kullanma.
    - Finansal tavsiye VERME: banka, kredi, yatırım, refinansman önerme.
    - Madde işareti, başlık, emoji kullanma. Düz paragraf yaz.
    - En fazla 3 cümle.
    """

    // MARK: Zaman aşımı yardımcısı

    private struct ZamanAsimiHatasi: Error {}

    private func withZamanAsimi<T: Sendable>(
        saniye: UInt64,
        _ is: @escaping @Sendable () async throws -> T
    ) async throws -> T {
        try await withThrowingTaskGroup(of: T.self) { grup in
            grup.addTask { try await `is`() }
            grup.addTask {
                try await Task.sleep(nanoseconds: saniye * 1_000_000_000)
                throw ZamanAsimiHatasi()
            }
            guard let ilk = try await grup.next() else { throw ZamanAsimiHatasi() }
            grup.cancelAll()
            return ilk
        }
    }
}

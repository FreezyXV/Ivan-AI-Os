import Foundation
import Security
import LocalAuthentication

// Private pipe protocol. Credential values never enter argv or error messages.
let args = CommandLine.arguments
func fail(_ code: String) -> Never {
    FileHandle.standardError.write(Data((code + "\n").utf8)); exit(1)
}
guard args.count == 3, ["store", "read", "delete"].contains(args[1]),
      args[2] == "jev-gateway" || args[2].range(of: "^test-[a-f0-9-]{36}$", options: .regularExpression) != nil
else { fail("KEYCHAIN_ARGUMENTS_REFUSED") }
let context = LAContext()
context.interactionNotAllowed = true
let query: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
    kSecAttrService as String: "com.ivan-ai-os.typesafe", kSecAttrAccount as String: args[2],
    kSecUseAuthenticationContext as String: context]
switch args[1] {
case "store":
    let data = FileHandle.standardInput.readData(ofLength: 4001)
    guard !data.isEmpty, data.count <= 4000, let text = String(data: data, encoding: .utf8),
          !text.unicodeScalars.contains(where: { CharacterSet.whitespacesAndNewlines.contains($0) })
    else { fail("KEYCHAIN_INPUT_REFUSED") }
    let status = SecItemUpdate(query as CFDictionary, [kSecValueData as String: data] as CFDictionary)
    if status == errSecItemNotFound {
        var item = query
        item[kSecValueData as String] = data
        guard SecItemAdd(item as CFDictionary, nil) == errSecSuccess else { fail("KEYCHAIN_STORE_REFUSED") }
    } else if status != errSecSuccess { fail("KEYCHAIN_STORE_REFUSED") }
    print("KEYCHAIN_STORED")
case "read":
    var lookup = query
    lookup[kSecReturnData as String] = true
    lookup[kSecMatchLimit as String] = kSecMatchLimitOne
    var result: CFTypeRef?
    guard SecItemCopyMatching(lookup as CFDictionary, &result) == errSecSuccess,
          let data = result as? Data, !data.isEmpty, data.count <= 4000
    else { fail("KEYCHAIN_UNAVAILABLE") }
    // Only the internal Node runner captures this stdout; never invoke directly for inspection.
    FileHandle.standardOutput.write(data)
case "delete":
    let status = SecItemDelete(query as CFDictionary)
    guard status == errSecSuccess || status == errSecItemNotFound else { fail("KEYCHAIN_DELETE_REFUSED") }
    print("KEYCHAIN_DELETED")
default: fail("KEYCHAIN_ARGUMENTS_REFUSED")
}

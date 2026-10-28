// Upload 2 bước: tạo bản ghi rồi PUT nội dung (dùng XHR để có % tiến trình)
export async function uploadFile(
  file: File,
  kind: "PRINT_ARTWORK" | "DESIGN_REFERENCE" | "DESIGN_DRAFT",
  onProgress?: (percent: number) => void,
): Promise<string> {
  const res = await fetch("/api/files", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, name: file.name, mime: file.type || guessMime(file.name), size: file.size }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error ?? "Không tải được file");
  const id: string = body.id;

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", `/api/files/${id}/content`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else {
        let message = "Tải file thất bại";
        try {
          message = JSON.parse(xhr.responseText).error ?? message;
        } catch {}
        reject(new Error(message));
      }
    };
    xhr.onerror = () => reject(new Error("Mất kết nối khi tải file"));
    xhr.send(file);
  });
  return id;
}

function guessMime(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    tif: "image/tiff",
    tiff: "image/tiff",
    webp: "image/webp",
    ai: "application/postscript",
    eps: "application/postscript",
    psd: "image/vnd.adobe.photoshop",
    zip: "application/zip",
  };
  return map[ext ?? ""] ?? "application/octet-stream";
}

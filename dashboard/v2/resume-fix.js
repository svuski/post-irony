(() => {
  const input = document.getElementById('resumeInput');
  if (!input) return;

  function fileBlob(record) {
    if (record?.blob instanceof Blob) return record.blob;
    if (record?.bytes) return new Blob([record.bytes], { type: record.type || 'application/octet-stream' });
    return null;
  }

  window.openBlob = function(record) {
    const blob = fileBlob(record);
    if (!blob) {
      alert('이력서 파일 데이터를 읽지 못했어. 다시 추가해줘.');
      return;
    }
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  window.downloadBlob = function(record) {
    const blob = fileBlob(record);
    if (!blob) {
      alert('이력서 파일 데이터를 읽지 못했어. 다시 추가해줘.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = record.name || 'resume';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  input.onchange = async (event) => {
    const files = [...(event.target.files || [])];
    if (!files.length) return;

    const allowed = /\.(pdf|hwp|hwpx|doc|docx)$/i;
    const failed = [];

    for (const file of files) {
      try {
        if (!allowed.test(file.name)) throw new Error('unsupported');
        const bytes = await file.arrayBuffer();
        await resumePut({
          id: uid(),
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          addedAt: Date.now(),
          bytes
        });
      } catch (err) {
        console.error('Resume save failed:', file.name, err);
        failed.push(file.name);
      }
    }

    event.target.value = '';
    try {
      await refreshResumes();
    } catch (err) {
      console.error(err);
      alert('이력서 저장소를 새로고침하지 못했어. 브라우저 저장 권한을 확인해줘.');
      return;
    }

    if (failed.length) alert(`저장 실패: ${failed.join(', ')}`);
  };
})();
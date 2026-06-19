<script lang="ts">
import type { EmailsSendResponse } from "mailchannels-sdk";

const form = $state({
  to: "",
  subject: "",
  message: "",
  file: null as File | null,
  filename: ""
});

let loading = $state(false);
let result = $state<EmailsSendResponse["data"]>();

async function sendEmail (e: SubmitEvent) {
  e.preventDefault();
  const formData = new FormData();

  const { file, ...data } = form;

  formData.append("payload", JSON.stringify(data));
  if (file instanceof File) {
    formData.append("file", file);
  }

  loading = true;

  const response = await fetch("/api/emails/send-attachment", {
    method: "POST",
    body: formData
  });

  result = await response.json();
  loading = false;
}

const addFile = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    form.file = target.files[0] ?? null;
  }
};
</script>

<h1>Send an email with an attachment</h1>

<form class="form" onsubmit={sendEmail}>
  <div class="input">
    <label for="to">To:</label>
    <input
      id="to"
      name="to"
      type="email"
      placeholder="to@example.com"
      bind:value={form.to}
      required
    >
  </div>
  <div class="input">
    <label for="subject">Subject:</label>
    <input
      id="subject"
      name="subject"
      type="text"
      placeholder="Your email subject"
      bind:value={form.subject}
      required
    >
  </div>
  <div class="input">
    <label for="message">Message:</label>
    <textarea
      id="message"
      name="message"
      placeholder="Write a message"
      bind:value={form.message}
      required
    >
    </textarea>
  </div>
  <div class="input">
    <label for="file">Attachment File:</label>
    <input
      id="file"
      name="file"
      type="file"
      onchange={addFile}
      required
    >
  </div>
  <div class="input">
    <label for="filename">Attachment Filename:</label>
    <input
      id="filename"
      name="filename"
      type="text"
      placeholder="image.jpg"
      bind:value={form.filename}
      required
    >
  </div>
  <button type="submit" disabled={loading}>
    {loading ? "Sending..." : "Send Email"}
  </button>
</form>

{#if result}
  <pre>{JSON.stringify(result, null, 2)}</pre>
{/if}

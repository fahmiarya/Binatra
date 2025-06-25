<script setup lang="ts">
import BaseHeader from '@/components/shared/BaseHeader.vue'
import { ref, onMounted } from 'vue'
import { useAccountStore } from '@/stores/accountStore'
import { useRouter } from 'vue-router'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'

const accountStore = useAccountStore()
const router = useRouter()
const rememberMe = ref(true)

const formData = ref({
  username: '',
  password: '',
})

// Isi otomatis username dari localStorage saat halaman dibuka
onMounted(() => {
  const savedUsername = localStorage.getItem('username')
  if (savedUsername) {
    formData.value.username = savedUsername
    rememberMe.value = true
  }
})

const login = async () => {
  if (!formData.value.username || !formData.value.password) {
    showErrToast('Username dan Password tidak boleh kosong.')
    return
  }

  try {
    await accountStore.login(formData.value, rememberMe.value)
    console.log('Token Setelah Login:', accountStore.token)
    console.log('User Setelah Login:', accountStore.user)

    if (rememberMe.value) {
      localStorage.setItem('username', formData.value.username)
    } else {
      localStorage.removeItem('username')
    }

    showSuccessToast('Login berhasil!')
    router.push('/home')
  } catch (error) {
    showErrToast('Login gagal. Silakan coba lagi.')
  }
}

const showSuccessToast = (msg: string) => {
  toast.success(msg, { autoClose: 3000, position: 'top-right' })
}

const showErrToast = (msg: string) => {
  toast.error(msg, { autoClose: 3000, position: 'top-right' })
}

onMounted(() => {
  accountStore.loadFromStorage()

  const savedUsername = localStorage.getItem('username')
  if (savedUsername) {
    formData.value.username = savedUsername
    rememberMe.value = true
  }
})
</script>

<template>
  <section>
    <div class="relative flex items-center p-0 overflow-hidden bg-center bg-cover min-h-75-screen">
      <div class="container z-10">
        <div class="flex flex-wrap mt-0 -mx-3">
          <div
            class="flex flex-col w-full max-w-full px-3 mx-auto md:flex-0 shrink-0 md:w-6/12 lg:w-5/12 xl:w-4/12"
          >
            <div
              class="relative flex flex-col min-w-0 mt-32 break-words bg-transparent border-0 shadow-none rounded-2xl bg-clip-border"
            >
              <div class="p-6 pb-0 mb-0 bg-transparent border-b-0 rounded-t-2xl">
                <h3
                  class="relative z-10 font-bold text-transparent bg-gradient-to-br from-slate-700 to-blue-500 bg-clip-text"
                >
                  Selamat Datang Kembali
                </h3>
                <p class="mb-0">Masukkan Username dan Password untuk sign in</p>
              </div>
              <div class="flex-auto p-6">
                <form role="form">
                  <label class="mb-2 ml-1 font-bold text-xs text-slate-700">Username</label>
                  <div class="mb-4">
                    <input
                      type="text"
                      v-model="formData.username"
                      class="focus:shadow-soft-primary-outline text-sm leading-5.6 ease-soft block w-full appearance-none rounded-lg border border-solid border-gray-300 bg-white bg-clip-padding px-3 py-2 font-normal text-gray-700 transition-all focus:border-fuchsia-300 focus:outline-none focus:transition-shadow"
                      placeholder="Username"
                      aria-label="Username"
                      aria-describedby="email-addon"
                    />
                  </div>
                  <label class="mb-2 ml-1 font-bold text-xs text-slate-700">Password</label>
                  <div class="mb-4">
                    <input
                      type="password"
                      v-model="formData.password"
                      class="focus:shadow-soft-primary-outline text-sm leading-5.6 ease-soft block w-full appearance-none rounded-lg border border-solid border-gray-300 bg-white bg-clip-padding px-3 py-2 font-normal text-gray-700 transition-all focus:border-fuchsia-300 focus:outline-none focus:transition-shadow"
                      placeholder="Password"
                      aria-label="Password"
                      aria-describedby="password-addon"
                    />
                  </div>
                  <div class="min-h-6 mb-0.5 block pl-12">
                    <input
                      id="rememberMe"
                      v-model="rememberMe"
                      class="mt-0.54 rounded-10 duration-250 ease-soft-in-out after:rounded-circle after:shadow-soft-2xl after:duration-250 checked:after:translate-x-5.25 h-5 relative float-left -ml-12 w-10 cursor-pointer appearance-none border border-solid border-gray-200 bg-slate-800/10 bg-none bg-contain bg-left bg-no-repeat align-top transition-all after:absolute after:top-px after:h-4 after:w-4 after:translate-x-px after:bg-white after:content-[''] checked:border-slate-800/95 checked:bg-slate-800/95 checked:bg-none checked:bg-right"
                      type="checkbox"
                    />
                    <label
                      class="mb-2 ml-1 font-normal cursor-pointer select-none text-sm text-slate-700"
                      for="rememberMe"
                      >Ingat saya</label
                    >
                  </div>
                  <div class="text-center">
                    <button
                      type="button"
                      class="inline-block w-full px-6 py-3 mt-6 mb-0 font-bold text-center text-white uppercase align-middle transition-all border-0 rounded-lg cursor-pointer shadow-soft-md bg-x-25 bg-150 leading-pro text-xs ease-soft-in tracking-tight-soft bg-slate-700 hover:scale-102 hover:shadow-soft-xs"
                      @click="login"
                    >
                      Sign in
                    </button>
                  </div>
                </form>
              </div>
              <div
                class="p-6 px-1 pt-0 text-center bg-transparent border-t-0 border-t-solid rounded-b-2xl lg:px-2"
              >
                <p class="mx-auto mb-6 leading-normal text-sm">
                  Tidak punya akun?
                  <a
                    href="/SignUp"
                    class="relative z-10 font-semibold text-transparent bg-gradient-to-br from-slate-500 to-blue-500 bg-clip-text"
                    >Sign up</a
                  >
                </p>
              </div>
            </div>
          </div>
          <div class="w-full max-w-full px-3 lg:flex-0 shrink-0 md:w-6/12">
            <div
              class="absolute top-0 hidden w-3/5 h-full -mr-32 overflow-hidden -skew-x-10 -right-40 rounded-bl-xl md:block"
            >
              <div
                class="absolute inset-x-0 top-0 z-0 h-full -ml-16 bg-[length:55%] bg-gradient-to-br from-slate-700 via-indigo-700 to-sky-400 skew-x-10"
                style="
                  background-image: url('https://img.freepik.com/vetores-premium/mapa-da-cidade-surabaya-indonesia-asia-impressao-azul-rodada-ilustracao-vetorial-do-circulo_478328-5982.jpg');
                "
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@import '@/assets/css/soft-ui-dashboard-tailwind.css';
</style>

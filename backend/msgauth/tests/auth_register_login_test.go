package tests

import (
	"log"
	"math/rand"
	"msgauth/internal/config"
	"msgauth/internal/storage"
	"msgauth/tests/suite"
	"os"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	msgv1auth "github.com/snowwyd/protos/gen/go/messenger/msgauth"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const (
	appID          = "67bdaa08e574192b82932ddd"
	appSecret      = "sanyakrut"
	passLenValid   = 10
	passLenInvalid = 7
	testValidEmail = "snowwyd@gmail.com"
)

// инициализация базы через утилиту init.go
func TestMain(m *testing.M) {
	os.Setenv("CONFIG_PATH", "../config/local.yaml")
	cfg := config.MustLoad()
	cleaner, err := storage.NewTestDBCleaner(cfg.StoragePath, "auth")
	if err != nil {
		log.Fatalf("MongoDB connection error: %v", err)
	}
	defer cleaner.Close()

	if err := cleaner.Cleanup(); err != nil {
		log.Fatalf("Error initializing DB: %v", err)
	}

	code := m.Run()
	os.Exit(code)
}

func TestRegisterLogin_Login_HappyPath(t *testing.T) {
	ctx, st := suite.New(t)

	email := genEmail(testValidEmail)
	pass := genPassword(passLenValid)

	respReg, err := st.AuthClient.Register(ctx, &msgv1auth.RegisterRequest{
		Email:    email,
		Password: pass,
	})
	require.NoError(t, err)
	assert.NotEmpty(t, respReg.GetUserId())

	respLogin, err := st.AuthClient.Login(ctx, &msgv1auth.LoginRequest{
		Email:    email,
		Password: pass,
		AppId:    appID,
	})
	require.NoError(t, err)

	loginTime := time.Now()
	token := respLogin.GetToken()

	require.NotEmpty(t, token)

	tokenParsed, err := jwt.Parse(token, func(token *jwt.Token) (interface{}, error) {
		return []byte(appSecret), nil
	})
	require.NoError(t, err)

	claims, ok := tokenParsed.Claims.(jwt.MapClaims)
	assert.True(t, ok)

	assert.Equal(t, respReg.GetUserId(), claims["uid"].(string))
	assert.Equal(t, email, claims["email"].(string))
	assert.Equal(t, appID, claims["app_id"].(string))

	const deltaSeconds = 1
	assert.InDelta(t, loginTime.Add(st.Cfg.TokenTTL).Unix(), claims["exp"].(float64), deltaSeconds)
}

func TestRegisterIsAdmin(t *testing.T) {
	ctx, st := suite.New(t)

	email := testValidEmail
	pass := genPassword(passLenValid)
	isAdmin := true

	respReg, err := st.AuthClient.Register(ctx, &msgv1auth.RegisterRequest{
		Email:    email,
		Password: pass,
	})
	require.NoError(t, err)
	assert.NotEmpty(t, respReg.GetUserId())

	respIsAdmin, err := st.AuthClient.IsAdmin(ctx, &msgv1auth.IsAdminRequest{
		UserId: respReg.GetUserId(),
	})
	require.NoError(t, err)
	assert.NotEmpty(t, respIsAdmin.IsAdmin)

	assert.Equal(t, respIsAdmin.IsAdmin, isAdmin)

	email = genEmail(testValidEmail)
	pass = genPassword(passLenValid)
	isAdmin = false

	respReg, err = st.AuthClient.Register(ctx, &msgv1auth.RegisterRequest{
		Email:    email,
		Password: pass,
	})
	require.NoError(t, err)
	assert.NotEmpty(t, respReg.GetUserId())

	respIsAdmin, err = st.AuthClient.IsAdmin(ctx, &msgv1auth.IsAdminRequest{
		UserId: respReg.GetUserId(),
	})
	require.NoError(t, err)
	assert.NotNil(t, respIsAdmin.IsAdmin)

	assert.Equal(t, respIsAdmin.IsAdmin, isAdmin)

}

func TestRegister_FailCases(t *testing.T) {
	ctx, st := suite.New(t)

	tests := []struct {
		name        string
		email       string
		password    string
		expectedErr string
	}{
		{
			name:        "Register with Empty Password",
			email:       genEmail(testValidEmail),
			password:    "",
			expectedErr: "password is required",
		},
		{
			name:        "Register with Empty Email",
			email:       "",
			password:    genPassword(passLenValid),
			expectedErr: "email is required",
		},
		{
			name:        "Register with Both Empty Email and Password",
			email:       "",
			password:    "",
			expectedErr: "email is required",
		},
		{
			name:        "Register with non valid Email 1",
			email:       "incorrect email",
			password:    genPassword(passLenValid),
			expectedErr: "email format must be example@mail.com and password must be at least 8 characters long",
		},
		{
			name:        "Register with non valid Email 2",
			email:       "incorrect email@gmail.com",
			password:    genPassword(passLenValid),
			expectedErr: "email format must be example@mail.com and password must be at least 8 characters long",
		},
		{
			name:        "Register with non valid Email 3",
			email:       "incorrect_email@gmail..com",
			password:    genPassword(passLenValid),
			expectedErr: "email format must be example@mail.com and password must be at least 8 characters long",
		},
		{
			name:        "Register with non valid Password 1",
			email:       genEmail(testValidEmail),
			password:    genPassword(passLenInvalid),
			expectedErr: "email format must be example@mail.com and password must be at least 8 characters long",
		},
		{
			name:        "Register with non valid Password 2",
			email:       genEmail(testValidEmail),
			password:    "invalid password ",
			expectedErr: "email format must be example@mail.com and password must be at least 8 characters long",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := st.AuthClient.Register(ctx, &msgv1auth.RegisterRequest{
				Email:    tt.email,
				Password: tt.password,
			})
			require.Error(t, err)
			require.Contains(t, err.Error(), tt.expectedErr)
		})
	}
}

func TestLogin_FailCases(t *testing.T) {
	ctx, st := suite.New(t)

	tests := []struct {
		name        string
		email       string
		password    string
		appID       string
		expectedErr string
	}{
		{
			name:        "Login with Empty Password",
			email:       genEmail(testValidEmail),
			password:    "",
			appID:       appID,
			expectedErr: "password is required",
		},
		{
			name:        "Login with Empty Email",
			email:       "",
			password:    genPassword(passLenValid),
			appID:       appID,
			expectedErr: "email is required",
		},
		{
			name:        "Login with Both Empty Email and Password",
			email:       "",
			password:    "",
			appID:       appID,
			expectedErr: "email is required",
		},
		{
			name:        "Login with Non-Matching Password",
			email:       genEmail(testValidEmail),
			password:    genPassword(passLenValid),
			appID:       appID,
			expectedErr: "invalid credentials",
		},
		{
			name:        "Login without AppID",
			email:       genEmail(testValidEmail),
			password:    genPassword(passLenValid),
			appID:       "",
			expectedErr: "app_id is required",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := st.AuthClient.Register(ctx, &msgv1auth.RegisterRequest{
				Email:    genEmail(testValidEmail),
				Password: genPassword(passLenValid),
			})
			require.NoError(t, err)

			_, err = st.AuthClient.Login(ctx, &msgv1auth.LoginRequest{
				Email:    tt.email,
				Password: tt.password,
				AppId:    tt.appID,
			})
			require.Error(t, err)
			require.Contains(t, err.Error(), tt.expectedErr)
		})
	}
}

// Функция генерирует строку из трех случайных букв от 'a' до 'z'

func randomLetters(n int) string {
	letters := []rune("abcdefghijklmnopqrstuvwxyz")
	var result []rune

	for i := 0; i < n; i++ {
		result = append(result, letters[rand.Intn(len(letters))])
	}

	return string(result)
}

func genEmail(input string) string {
	prefix := randomLetters(3)
	return prefix + input
}

func genPassword(len int) string {
	return randomLetters(len)
}

func init() {
	rand.Seed(time.Now().UnixNano())
}
